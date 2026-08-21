import { Router, type IRouter, type Request } from "express";
import { randomUUID } from "node:crypto";
import { eq, and, sql } from "drizzle-orm";
import { del, get, head } from "@vercel/blob";
import { generateClientTokenFromReadWriteToken } from "@vercel/blob/client";
import {
  db,
  candidateProfilesTable,
  resumeProfilesTable,
  pendingResumeUploadsTable,
} from "@workspace/db";
import {
  RequestResumeUploadUrlBody,
  RequestResumeUploadUrlResponse,
  CompleteResumeUploadBody,
  CompleteResumeUploadResponse,
} from "@workspace/api-zod";
import { requireAuth } from "../middlewares/requireAuth";
import { ObjectStorageService } from "../lib/objectStorage";
import { setObjectAclPolicy } from "../lib/objectAcl";
import { parseResumeText } from "../lib/resumeParser";

type AuthedRequest = Request & { clerkUserId: string };
type PdfLoadingTask = ReturnType<
  (typeof import("pdfjs-dist/legacy/build/pdf.mjs"))["getDocument"]
>;
type PdfDocument = Awaited<PdfLoadingTask["promise"]>;

const router: IRouter = Router();
const storage = new ObjectStorageService();

const MAX_RESUME_BYTES = 5 * 1024 * 1024; // 5 MiB
const MIN_RESUME_BYTES = 1;
const UPLOAD_TTL_MS = 15 * 60 * 1000; // 15 minutes
const MAX_PDF_PAGES = 50;
const MAX_EXTRACTED_TEXT_CHARS = 200_000;
const PDF_PARSE_TIMEOUT_MS = 10_000;

function isVercelBlobConfigured(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

function isVercelBlobPath(objectPath: string): boolean {
  return !objectPath.startsWith("/objects/");
}

async function deleteStoredResume(objectPath: string): Promise<void> {
  if (isVercelBlobPath(objectPath)) {
    await del(objectPath).catch(() => undefined);
    return;
  }

  const file = await storage.getObjectEntityFile(objectPath);
  await file.delete({ ignoreNotFound: true });
}

/** Resolve candidateId from clerkUserId */
async function getCandidateId(clerkUserId: string): Promise<number | null> {
  const [candidate] = await db
    .select({ id: candidateProfilesTable.id })
    .from(candidateProfilesTable)
    .where(eq(candidateProfilesTable.clerkUserId, clerkUserId));
  return candidate?.id ?? null;
}

/**
 * POST /resume/upload/request-url
 * Request a private presigned upload URL for a PDF resume.
 * Only accepts .pdf files with application/pdf or application/octet-stream.
 * File size must be 1 byte – 5 MiB.
 */
router.post(
  "/resume/upload/request-url",
  requireAuth,
  async (req, res): Promise<void> => {
    const clerkUserId = (req as AuthedRequest).clerkUserId;

    const parsed = RequestResumeUploadUrlBody.safeParse(req.body);
    if (!parsed.success) {
      req.log.warn({ error: parsed.error.message }, "Invalid upload request body");
      res.status(400).json({ error: parsed.error.message });
      return;
    }

    const { fileName, contentType, size } = parsed.data;

    // Validate file extension
    if (!fileName.toLowerCase().endsWith(".pdf")) {
      res.status(400).json({ error: "Only PDF files are accepted." });
      return;
    }

    // Validate size range
    if (size < MIN_RESUME_BYTES) {
      res.status(400).json({ error: "File must not be empty." });
      return;
    }
    if (size > MAX_RESUME_BYTES) {
      res.status(413).json({ error: "File exceeds the 5 MiB limit." });
      return;
    }

    // Validate content type
    if (
      contentType !== "application/pdf" &&
      contentType !== "application/octet-stream"
    ) {
      res.status(400).json({ error: "Only application/pdf or application/octet-stream are accepted." });
      return;
    }

    const candidateId = await getCandidateId(clerkUserId);
    if (!candidateId) {
      res.status(404).json({ error: "Candidate profile not found. Create your profile first." });
      return;
    }

    const useVercelBlob = isVercelBlobConfigured();
    let objectPath: string;
    let uploadUrl: string | undefined;
    let clientToken: string | undefined;

    if (useVercelBlob) {
      objectPath = `resumes/${candidateId}/${randomUUID()}.pdf`;
      clientToken = await generateClientTokenFromReadWriteToken({
        pathname: objectPath,
        maximumSizeInBytes: MAX_RESUME_BYTES,
        allowedContentTypes: ["application/pdf"],
        validUntil: Date.now() + UPLOAD_TTL_MS,
        addRandomSuffix: false,
        allowOverwrite: false,
      });
    } else {
      uploadUrl = await storage.getObjectEntityUploadURL();
      // normalizeObjectEntityPath converts GCS URL → /objects/... path
      objectPath = storage.normalizeObjectEntityPath(uploadUrl);
    }

    // Record pending upload (expires in 15 min)
    const expiresAt = new Date(Date.now() + UPLOAD_TTL_MS);
    await db.insert(pendingResumeUploadsTable).values({
      candidateId,
      objectPath,
      fileName,
      expiresAt,
    });

    const result = RequestResumeUploadUrlResponse.parse({
      objectPath,
      uploadStrategy: useVercelBlob ? "vercel-blob" : "replit-gcs",
      ...(uploadUrl ? { uploadUrl } : {}),
      ...(clientToken ? { clientToken } : {}),
    });

    req.log.info({ candidateId }, "Resume upload URL issued");
    res.json(result);
  },
);

/**
 * POST /resume/upload/complete
 * Validate, extract text and attach uploaded PDF resume.
 * Verifies pending upload ownership, expiry, object metadata, PDF signature,
 * parsed text readability, and sets private ACL with Clerk owner.
 */
router.post(
  "/resume/upload/complete",
  requireAuth,
  async (req, res): Promise<void> => {
    const clerkUserId = (req as AuthedRequest).clerkUserId;

    const parsed = CompleteResumeUploadBody.safeParse(req.body);
    if (!parsed.success) {
      req.log.warn({ error: parsed.error.message }, "Invalid upload complete body");
      res.status(400).json({ error: parsed.error.message });
      return;
    }

    const { objectPath, fileName } = parsed.data;

    const candidateId = await getCandidateId(clerkUserId);
    if (!candidateId) {
      res.status(404).json({ error: "Candidate profile not found." });
      return;
    }

    // Verify pending upload ownership before touching the object.
    const now = new Date();
    const [pending] = await db
      .select()
      .from(pendingResumeUploadsTable)
      .where(
        and(
          eq(pendingResumeUploadsTable.candidateId, candidateId),
          eq(pendingResumeUploadsTable.objectPath, objectPath),
        ),
      );

    if (!pending) {
      res.status(400).json({
        error: "Upload not found, already used, or expired. Please request a new upload URL.",
      });
      return;
    }

    if (pending.expiresAt <= now) {
      try {
        await deleteStoredResume(objectPath);
      } catch {
        // The upload may never have completed; the pending row still expires.
      }
      await db
        .delete(pendingResumeUploadsTable)
        .where(eq(pendingResumeUploadsTable.id, pending.id));
      res.status(400).json({
        error: "Upload expired. Please request a new upload URL.",
      });
      return;
    }

    // Retrieve the object from the active private storage provider.
    let fileBytes: Buffer;
    let objectSize: number;
    let objectContentType: string;
    let objectFile;
    try {
      if (isVercelBlobPath(objectPath)) {
        const blobMetadata = await head(objectPath);
        objectSize = blobMetadata.size;
        objectContentType = blobMetadata.contentType;
        const blob = await get(objectPath, { access: "private", useCache: false });
        if (!blob || blob.statusCode !== 200) {
          throw new Error("BLOB_NOT_FOUND");
        }
        fileBytes = Buffer.from(await new Response(blob.stream).arrayBuffer());
      } else {
        objectFile = await storage.getObjectEntityFile(objectPath);
        const [metadata] = await objectFile.getMetadata();
        objectSize = Number(metadata.size ?? 0);
        objectContentType = String(metadata.contentType ?? "");
        const downloadResponse = await storage.downloadObject(objectFile, 0);
        fileBytes = Buffer.from(await downloadResponse.arrayBuffer());
      }
    } catch {
      res.status(400).json({ error: "Uploaded object not found in storage." });
      return;
    }

    // Verify object metadata: size and content type
    if (objectSize < MIN_RESUME_BYTES || objectSize > MAX_RESUME_BYTES) {
      await deleteStoredResume(objectPath);
      res.status(400).json({
        error: `Object size ${objectSize} bytes is outside the allowed 1–${MAX_RESUME_BYTES} byte range.`,
      });
      return;
    }
    if (
      objectContentType !== "application/pdf" &&
      objectContentType !== "application/octet-stream"
    ) {
      await deleteStoredResume(objectPath);
      res.status(400).json({ error: "Object content type must be application/pdf." });
      return;
    }

    // Check %PDF signature
    if (!fileBytes.slice(0, 4).equals(Buffer.from("%PDF"))) {
      await deleteStoredResume(objectPath);
      res.status(400).json({ error: "Uploaded file is not a valid PDF." });
      return;
    }

    // Extract text using pdfjs-dist (legacy build)
    let extractedText = "";
    let loadingTask: PdfLoadingTask | undefined;
    let pdfDoc: PdfDocument | undefined;
    try {
      const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
      loadingTask = pdfjs.getDocument({ data: new Uint8Array(fileBytes) });
      pdfDoc = await Promise.race([
        loadingTask.promise,
        new Promise<never>((_resolve, reject) => {
          setTimeout(
            () => reject(new Error("PDF_PARSE_TIMEOUT")),
            PDF_PARSE_TIMEOUT_MS,
          );
        }),
      ]);
      if (pdfDoc.numPages > MAX_PDF_PAGES) {
        throw new Error("PDF_PAGE_LIMIT");
      }

      const parseStartedAt = Date.now();
      const textParts: string[] = [];
      for (let i = 1; i <= pdfDoc.numPages; i++) {
        if (Date.now() - parseStartedAt > PDF_PARSE_TIMEOUT_MS) {
          throw new Error("PDF_PARSE_TIMEOUT");
        }
        const page = await pdfDoc.getPage(i);
        const content = await page.getTextContent();
        const pageText = content.items
          .map((item) => ("str" in item ? item.str : ""))
          .join(" ");
        textParts.push(pageText);
        if (textParts.reduce((total, part) => total + part.length, 0) > MAX_EXTRACTED_TEXT_CHARS) {
          throw new Error("PDF_TEXT_LIMIT");
        }
      }
      extractedText = textParts.join("\n").trim();
    } catch (err) {
      await deleteStoredResume(objectPath);
      const errorName = err instanceof Error ? err.message : "PDF_PARSE_ERROR";
      req.log.warn({ errorName }, "PDF parse rejected");
      res.status(400).json({ error: "Could not parse the PDF file." });
      return;
    } finally {
      await pdfDoc?.destroy().catch(() => undefined);
      await loadingTask?.destroy().catch(() => undefined);
    }

    if (!extractedText) {
      await deleteStoredResume(objectPath);
      res.status(400).json({ error: "No readable text found in this PDF." });
      return;
    }

    // Vercel Blob enforces store-level privacy. Replit App Storage additionally
    // stores the owner metadata used by its object access layer.
    if (objectFile) {
      await setObjectAclPolicy(objectFile, {
        owner: clerkUserId,
        visibility: "private",
      });
    }

    const extractedTextPreview = extractedText.slice(0, 500);
    const parsedResume = parseResumeText(extractedText);

    // Update resume record with file path and extracted text preview
    const [updatedResume] = await db
      .insert(resumeProfilesTable)
      .values({
        candidateId,
        professionalSummary: parsedResume.professionalSummary,
        skills: parsedResume.skills,
        education: parsedResume.education,
        experience: parsedResume.experience,
        resumeFilePath: objectPath,
        resumeFileName: fileName,
        extractedTextPreview,
      })
      .onConflictDoUpdate({
        target: resumeProfilesTable.candidateId,
        set: {
          resumeFilePath: objectPath,
          resumeFileName: fileName,
          extractedTextPreview,
          professionalSummary: parsedResume.professionalSummary,
          skills: parsedResume.skills,
          education: parsedResume.education,
          experience: parsedResume.experience,
          updatedAt: sql`now()`,
        },
      })
      .returning();

    // Delete the pending record (consumed)
    await db
      .delete(pendingResumeUploadsTable)
      .where(eq(pendingResumeUploadsTable.id, pending.id));

    req.log.info({ candidateId }, "Resume upload completed and attached");

    res.json(
      CompleteResumeUploadResponse.parse({
        fileName,
        extractedTextPreview,
        resume: updatedResume,
      }),
    );
  },
);

export default router;

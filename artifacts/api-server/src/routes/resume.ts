import { Router, type IRouter, type Request } from "express";
import { eq, sql } from "drizzle-orm";
import { db, candidateProfilesTable, resumeProfilesTable } from "@workspace/db";
import {
  GetResumeResponse,
  UpdateResumeBody,
  UpdateResumeResponse,
} from "@workspace/api-zod";
import { requireAuth } from "../middlewares/requireAuth.js";

type AuthedRequest = Request & { clerkUserId: string };

const router: IRouter = Router();

/** Look up (or assert) the candidate row for the authenticated Clerk user. */
async function getCandidateId(
  clerkUserId: string,
): Promise<number | null> {
  const [candidate] = await db
    .select({ id: candidateProfilesTable.id })
    .from(candidateProfilesTable)
    .where(eq(candidateProfilesTable.clerkUserId, clerkUserId));
  return candidate?.id ?? null;
}

/**
 * Build a safe empty ResumeProfile for first-use onboarding.
 * Returns an object matching GetResumeResponse shape without an id
 * (used when no DB row exists yet).
 */
function emptyResumePayload() {
  return {
    id: 0,
    professionalSummary: "",
    skills: [] as string[],
    education: "",
    experience: "",
    resumeFileName: null,
    extractedTextPreview: null,
    updatedAt: new Date(),
  };
}

/**
 * GET /resume — get the authenticated candidate resume profile
 * Returns a safe empty profile if no row exists yet (onboarding).
 */
router.get("/resume", requireAuth, async (req, res): Promise<void> => {
  const clerkUserId = (req as AuthedRequest).clerkUserId;
  const candidateId = await getCandidateId(clerkUserId);

  if (!candidateId) {
    // Candidate profile not set up — return empty for frontend onboarding
    res.json(GetResumeResponse.parse(emptyResumePayload()));
    return;
  }

  const [resume] = await db
    .select()
    .from(resumeProfilesTable)
    .where(eq(resumeProfilesTable.candidateId, candidateId));

  if (!resume) {
    res.json(GetResumeResponse.parse(emptyResumePayload()));
    return;
  }

  res.json(GetResumeResponse.parse(resume));
});

/**
 * PUT /resume — create or update resume profile details (upsert by candidateId)
 */
router.put("/resume", requireAuth, async (req, res): Promise<void> => {
  const clerkUserId = (req as AuthedRequest).clerkUserId;

  const parsed = UpdateResumeBody.safeParse(req.body);
  if (!parsed.success) {
    req.log.warn({ error: parsed.error.message }, "Invalid resume body");
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const candidateId = await getCandidateId(clerkUserId);
  if (!candidateId) {
    res.status(404).json({ error: "Candidate profile not found. Create your profile first." });
    return;
  }

  const { professionalSummary, skills, education, experience } = parsed.data;

  // Deduplicate and normalize skills
  const normalizedSkills = [
    ...new Set(skills.map((s) => s.trim()).filter(Boolean)),
  ];

  const [resume] = await db
    .insert(resumeProfilesTable)
    .values({
      candidateId,
      professionalSummary,
      skills: normalizedSkills,
      education,
      experience,
    })
    .onConflictDoUpdate({
      target: resumeProfilesTable.candidateId,
      set: {
        professionalSummary,
        skills: normalizedSkills,
        education,
        experience,
        updatedAt: sql`now()`,
      },
    })
    .returning();

  res.json(UpdateResumeResponse.parse(resume));
});

export default router;

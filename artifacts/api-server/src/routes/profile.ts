import { Router, type IRouter, type Request } from "express";
import { eq, sql } from "drizzle-orm";
import { db, candidateProfilesTable } from "@workspace/db";
import {
  GetProfileResponse,
  UpdateProfileBody,
  UpdateProfileResponse,
} from "@workspace/api-zod";
import { requireAuth } from "../middlewares/requireAuth";

type AuthedRequest = Request & { clerkUserId: string };

const router: IRouter = Router();

/**
 * GET /profile — get the authenticated candidate profile
 */
router.get("/profile", requireAuth, async (req, res): Promise<void> => {
  const clerkUserId = (req as AuthedRequest).clerkUserId;

  const [profile] = await db
    .select()
    .from(candidateProfilesTable)
    .where(eq(candidateProfilesTable.clerkUserId, clerkUserId));

  if (!profile) {
    res.status(404).json({ error: "Profile not found" });
    return;
  }

  res.json(GetProfileResponse.parse(profile));
});

/**
 * PUT /profile — create or update the authenticated candidate profile
 * Uses upsert semantics keyed on clerkUserId.
 * Email is stored as lowercase (case-insensitive uniqueness at application boundary).
 */
router.put("/profile", requireAuth, async (req, res): Promise<void> => {
  const clerkUserId = (req as AuthedRequest).clerkUserId;

  const parsed = UpdateProfileBody.safeParse(req.body);
  if (!parsed.success) {
    req.log.warn({ error: parsed.error.message }, "Invalid profile body");
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { fullName, email, preferredLocation, country } = parsed.data;
  const emailLower = email.toLowerCase();

  // Upsert: if a profile for this clerkUserId exists, update it; otherwise insert
  const [profile] = await db
    .insert(candidateProfilesTable)
    .values({
      clerkUserId,
      fullName,
      email: emailLower,
      preferredLocation,
      country,
    })
    .onConflictDoUpdate({
      target: candidateProfilesTable.clerkUserId,
      set: {
        fullName,
        email: emailLower,
        preferredLocation,
        country,
        updatedAt: sql`now()`,
      },
    })
    .returning();

  res.json(UpdateProfileResponse.parse(profile));
});

export default router;

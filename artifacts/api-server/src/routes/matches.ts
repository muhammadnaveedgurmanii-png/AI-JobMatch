import { Router, type IRouter, type Request } from "express";
import { eq, or, ilike } from "drizzle-orm";
import {
  db,
  candidateProfilesTable,
  resumeProfilesTable,
  localJobsTable,
} from "@workspace/db";
import { ListMatchesResponse } from "@workspace/api-zod";
import { requireAuth } from "../middlewares/requireAuth.js";
import { calculateMatch } from "../lib/matchingService.js";

type AuthedRequest = Request & { clerkUserId: string };

const router: IRouter = Router();

/**
 * GET /matches — rank local jobs against the authenticated candidate's resume.
 * Filters to location-compatible jobs (preferred location + remote/hybrid).
 * Sorted descending by match percentage. No zero-match jobs returned.
 */
router.get("/matches", requireAuth, async (req, res): Promise<void> => {
  const clerkUserId = (req as AuthedRequest).clerkUserId;

  // Get candidate profile with preferred location
  const [candidate] = await db
    .select()
    .from(candidateProfilesTable)
    .where(eq(candidateProfilesTable.clerkUserId, clerkUserId));

  if (!candidate) {
    res.status(404).json({ error: "Candidate profile not found." });
    return;
  }

  // Get resume profile
  const [resume] = await db
    .select()
    .from(resumeProfilesTable)
    .where(eq(resumeProfilesTable.candidateId, candidate.id));

  if (!resume) {
    res.status(404).json({ error: "Resume profile not found." });
    return;
  }

  // Fetch location-compatible local jobs: preferred location + remote + hybrid
  const preferredLocation = candidate.preferredLocation ?? "Lahore";

  const jobs = await db
    .select()
    .from(localJobsTable)
    .where(
      or(
        ilike(localJobsTable.location, `%${preferredLocation}%`),
        ilike(localJobsTable.workMode, "%remote%"),
        ilike(localJobsTable.workMode, "%hybrid%"),
      ),
    );

  // Calculate match scores
  const matchedJobs: Array<{
    id: string;
    title: string;
    company: string;
    description: string;
    location: string;
    country: string | null;
    jobType: string;
    workMode: string;
    requiredSkills: string[];
    applyUrl: string;
    source: string;
    postedAt: Date | null;
    matchPercentage: number;
    matchedSkills: string[];
    missingSkills: string[];
  }> = [];

  for (const job of jobs) {
    const match = calculateMatch(resume.skills, job.requiredSkills);
    // Skip zero-match jobs
    if (match.matchPercentage === 0) continue;

    matchedJobs.push({
      id: String(job.id),
      title: job.title,
      company: job.company,
      description: job.description,
      location: job.location,
      country: job.country ?? null,
      jobType: job.jobType,
      workMode: job.workMode,
      requiredSkills: job.requiredSkills,
      applyUrl: job.applyUrl,
      source: job.source,
      postedAt: job.postedAt ?? null,
      matchPercentage: match.matchPercentage,
      matchedSkills: match.matchedSkills,
      missingSkills: match.missingSkills,
    });
  }

  // Sort descending by match percentage
  matchedJobs.sort((a, b) => b.matchPercentage - a.matchPercentage);

  res.json(ListMatchesResponse.parse(matchedJobs));
});

export default router;

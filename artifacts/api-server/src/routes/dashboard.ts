import { Router, type IRouter, type Request } from "express";
import { eq, or, ilike, sql } from "drizzle-orm";
import {
  db,
  candidateProfilesTable,
  resumeProfilesTable,
  localJobsTable,
} from "@workspace/db";
import { GetDashboardSummaryResponse } from "@workspace/api-zod";
import { requireAuth } from "../middlewares/requireAuth";
import { calculateMatch } from "../lib/matchingService";

type AuthedRequest = Request & { clerkUserId: string };

const router: IRouter = Router();

/**
 * GET /dashboard/summary — candidate readiness and matching summary.
 * Uses real DB aggregates:
 * - profileCompleteness: % of key profile/resume fields filled
 * - localJobs: total count from local_jobs
 * - matchedJobs: count of jobs with match > 0
 * - topSkills: most-demanded skills across all local jobs
 */
router.get(
  "/dashboard/summary",
  requireAuth,
  async (req, res): Promise<void> => {
    const clerkUserId = (req as AuthedRequest).clerkUserId;

    // Get candidate profile
    const [candidate] = await db
      .select()
      .from(candidateProfilesTable)
      .where(eq(candidateProfilesTable.clerkUserId, clerkUserId));

    // Get resume profile (if exists)
    let resume = null;
    if (candidate) {
      const [r] = await db
        .select()
        .from(resumeProfilesTable)
        .where(eq(resumeProfilesTable.candidateId, candidate.id));
      resume = r ?? null;
    }

    // Profile completeness: 5 key fields
    const completenessFields = [
      !!candidate?.fullName,
      !!candidate?.email,
      !!candidate?.preferredLocation,
      !!resume?.professionalSummary,
      (resume?.skills?.length ?? 0) > 0,
    ];
    const filledCount = completenessFields.filter(Boolean).length;
    const profileCompleteness = Math.round(
      (filledCount / completenessFields.length) * 100,
    );

    // Total local jobs count
    const [jobCountRow] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(localJobsTable);
    const localJobs = jobCountRow?.count ?? 0;

    // Top skills: unnest required_skills across all jobs and count occurrences
    const skillCountRows = await db.execute<{ skill: string; jobs: number }>(
      sql`
        SELECT skill, count(*)::int AS jobs
        FROM local_jobs, unnest(required_skills) AS skill
        GROUP BY skill
        ORDER BY jobs DESC
        LIMIT 10
      `,
    );

    const topSkills = (skillCountRows.rows ?? []).map((r) => ({
      skill: r.skill,
      jobs: r.jobs,
    }));

    // Matched jobs count (jobs with match > 0 for this candidate)
    let matchedJobs = 0;
    if (resume) {
      const preferredLocation = candidate?.preferredLocation ?? "Lahore";
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

      for (const job of jobs) {
        const match = calculateMatch(resume.skills, job.requiredSkills);
        if (match.matchPercentage > 0) matchedJobs++;
      }
    }

    res.json(
      GetDashboardSummaryResponse.parse({
        profileCompleteness,
        localJobs,
        matchedJobs,
        topSkills,
      }),
    );
  },
);

export default router;

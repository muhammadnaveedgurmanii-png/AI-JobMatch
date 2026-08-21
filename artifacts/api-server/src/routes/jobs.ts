import { Router, type IRouter } from "express";
import { and, eq, ilike, or } from "drizzle-orm";
import { db, localJobsTable } from "@workspace/db";
import {
  ListJobsQueryParams,
  ListJobsResponse,
  SearchLiveJobsQueryParams,
  SearchLiveJobsResponse,
} from "@workspace/api-zod";
import { requireAuth } from "../middlewares/requireAuth";
import { searchLiveJobs } from "../lib/jobSearch";

const router: IRouter = Router();

/**
 * GET /jobs — list locally curated jobs with optional filters.
 */
router.get("/jobs", requireAuth, async (req, res): Promise<void> => {
  const parsed = ListJobsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { location, jobType, workMode } = parsed.data;

  const conditions = [];
  if (location) conditions.push(ilike(localJobsTable.location, `%${location}%`));
  if (jobType) conditions.push(ilike(localJobsTable.jobType, `%${jobType}%`));
  if (workMode) conditions.push(ilike(localJobsTable.workMode, `%${workMode}%`));

  const jobs = await db
    .select()
    .from(localJobsTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(localJobsTable.postedAt);

  // Map DB rows to API schema (id is integer in DB, string in API)
  const mapped = jobs.map((j) => ({
    id: String(j.id),
    title: j.title,
    company: j.company,
    description: j.description,
    location: j.location,
    country: j.country ?? null,
    jobType: j.jobType,
    workMode: j.workMode,
    requiredSkills: j.requiredSkills,
    applyUrl: j.applyUrl,
    source: j.source,
    postedAt: j.postedAt ?? null,
  }));

  res.json(ListJobsResponse.parse(mapped));
});

/**
 * GET /jobs/search-live — search live jobs via JSearch.
 * Defaults country to PK and location to Lahore.
 * Returns 503 if RAPIDAPI_KEY is missing, 502 on upstream failure.
 */
router.get("/jobs/search-live", requireAuth, async (req, res): Promise<void> => {
  const parsed = SearchLiveJobsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { query, location, country, jobType, workMode, page } = parsed.data;

  try {
    const jobs = await searchLiveJobs({
      query,
      location,
      country,
      jobType,
      workMode,
      page,
    });

    const result = SearchLiveJobsResponse.parse({
      jobs,
      location: location ?? "Lahore",
      country: country ?? "PK",
      page,
    });

    res.json(result);
  } catch (err: unknown) {
    const error = err as Error & { code?: string };
    if (error.code === "MISSING_CONFIG") {
      req.log.warn("RAPIDAPI_KEY not configured");
      res.status(503).json({ error: error.message });
      return;
    }
    // UPSTREAM_ERROR or unexpected
    req.log.error({ msg: error.message }, "JSearch upstream error");
    res.status(502).json({ error: error.message });
  }
});

export default router;

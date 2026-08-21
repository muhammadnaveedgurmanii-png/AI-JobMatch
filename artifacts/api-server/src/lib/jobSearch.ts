/**
 * JSearch adapter — reads RAPIDAPI_KEY only at request time and never logs it.
 * Preserves job normalization, remote/hybrid detection, skills mapping,
 * safe URL handling, and good error mapping from the Python source reference.
 */

const JSEARCH_URL = "https://jsearch.p.rapidapi.com/search";
const REQUEST_TIMEOUT_MS = 20_000;
const DEFAULT_QUERY = "latest jobs";
const DEFAULT_LOCATION = "Lahore";
const DEFAULT_COUNTRY = "PK";

export type WorkMode = "Remote" | "Hybrid" | "On-site";
export type JobType = "Full-time" | "Part-time" | "Contract" | "Internship";

export interface NormalizedJob {
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
  postedAt: string | null;
}

/**
 * Build the JSearch query string from filters.
 * Pakistan/Lahore-focused — defaults country to PK and location to Lahore.
 */
export function buildJSearchQuery(params: {
  query?: string;
  location?: string;
  jobType?: string;
  workMode?: string;
}): string {
  const { query, location, jobType, workMode } = params;

  // If explicit query provided, use it with location appended
  if (query && query !== DEFAULT_QUERY) {
    const loc = location ?? DEFAULT_LOCATION;
    return `${query} ${loc} Pakistan`;
  }

  const terms: string[] = [];
  if (jobType) {
    const map: Record<string, string> = {
      Internship: "internship",
      "Full-time": "full time",
      "Part-time": "part time",
      Contract: "contract",
    };
    terms.push(map[jobType] ?? jobType);
  }
  if (workMode) {
    const map: Record<string, string> = {
      Remote: "remote",
      Hybrid: "hybrid",
      "On-site": "on site",
    };
    terms.push(map[workMode] ?? workMode);
  }
  const loc = location?.trim() ?? DEFAULT_LOCATION;
  terms.push(loc, "Pakistan");

  return terms.length > 2 ? terms.join(" ") : `${DEFAULT_QUERY} ${loc} Pakistan`;
}

/**
 * Only allow http:// and https:// apply URLs.
 * Returns null for missing, empty, or unsafe values.
 */
export function safeExternalUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    const u = new URL(value);
    return u.protocol === "http:" || u.protocol === "https:" ? value : null;
  } catch {
    return null;
  }
}

/** Detect work mode from JSearch job record. */
export function detectWorkMode(job: Record<string, unknown>): WorkMode {
  const arrangement = String(job.work_arrangement ?? "").toLowerCase();
  if (job.job_is_remote === true || arrangement.includes("remote")) {
    return "Remote";
  }
  if (arrangement.includes("hybrid")) {
    return "Hybrid";
  }
  const text = (
    String(job.job_title ?? "") +
    " " +
    String(job.job_description ?? "")
  ).toLowerCase();
  return text.includes("hybrid") ? "Hybrid" : "On-site";
}

/** Normalize job location. */
export function normalizeLocation(job: Record<string, unknown>): string {
  if (
    job.job_is_remote === true ||
    String(job.work_arrangement ?? "").toLowerCase().includes("remote")
  ) {
    return "Remote";
  }
  if (job.job_location) return String(job.job_location);
  const parts = [job.job_city, job.job_state, job.job_country].filter(Boolean);
  return parts.length > 0
    ? parts.map(String).join(", ")
    : "Location not specified";
}

/** Normalize job type from JSearch employment type codes. */
export function normalizeJobType(job: Record<string, unknown>): string {
  const value = String(job.job_employment_type ?? "Not specified").toUpperCase();
  const map: Record<string, string> = {
    FULLTIME: "Full-time",
    PARTTIME: "Part-time",
    CONTRACTOR: "Contract",
    INTERN: "Internship",
  };
  return map[value] ?? value;
}

/**
 * Extract and dedupe required skills from JSearch job.
 * Returns a string[] (not a comma-joined string like the Python source).
 */
export function extractRequiredSkills(job: Record<string, unknown>): string[] {
  const skills = (job.job_required_skills as string[] | null) ?? [];
  const tech = (job.required_technologies as string[] | null) ?? [];
  const preferred = (job.preferred_technologies as string[] | null) ?? [];
  const combined = [...skills, ...tech, ...preferred];
  return [
    ...new Set(
      combined
        .map((s) => String(s).trim())
        .filter(Boolean),
    ),
  ];
}

/** Normalize a raw JSearch job record into a NormalizedJob. */
export function normalizeJSearchJob(
  job: Record<string, unknown>,
  index: number,
): NormalizedJob | null {
  const applyUrl = safeExternalUrl(
    (job.job_apply_link as string | null) ??
      (job.job_google_link as string | null),
  );
  if (!applyUrl) {
    // Skip jobs with no valid apply URL
    return null;
  }

  const publisher = String(job.job_publisher ?? "JSearch");

  return {
    id: `jsearch-${index}`,
    title: String(job.job_title ?? "Untitled job").slice(0, 150),
    company: String(job.employer_name ?? publisher).slice(0, 150),
    description: String(
      job.job_description ?? "No description available.",
    ),
    location: normalizeLocation(job),
    country: String(job.job_country ?? DEFAULT_COUNTRY) || null,
    jobType: normalizeJobType(job),
    workMode: detectWorkMode(job),
    requiredSkills: extractRequiredSkills(job),
    applyUrl,
    source: publisher.slice(0, 100),
    postedAt:
      job.job_posted_at_datetime_utc != null
        ? String(job.job_posted_at_datetime_utc)
        : null,
  };
}

export interface JSearchParams {
  query?: string;
  location?: string;
  country?: string;
  jobType?: string;
  workMode?: string;
  page?: number;
}

/**
 * Search live jobs via JSearch.
 * Reads RAPIDAPI_KEY only at request time. Never logs the key.
 * Returns 503 if not configured, 502 on upstream failure.
 */
export async function searchLiveJobs(
  params: JSearchParams,
): Promise<NormalizedJob[]> {
  // Read key at request time only
  const apiKey = (process.env.RAPIDAPI_KEY ?? "").trim();
  if (!apiKey) {
    const err: Error & { code?: string } = new Error(
      "Live search is not configured. Set RAPIDAPI_KEY in the deployment environment.",
    );
    err.code = "MISSING_CONFIG";
    throw err;
  }

  const query = buildJSearchQuery({
    query: params.query,
    location: params.location ?? DEFAULT_LOCATION,
    jobType: params.jobType,
    workMode: params.workMode,
  });

  const location = params.location ?? DEFAULT_LOCATION;
  const country = (params.country ?? DEFAULT_COUNTRY).toLowerCase();
  const page = Math.min(Math.max(params.page ?? 1, 1), 10);

  const searchParams = new URLSearchParams({
    query,
    page: String(page),
    num_pages: "1",
    date_posted: "all",
    country,
    language: "en",
    location,
  });

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let rawPayload: unknown;
  try {
    const response = await fetch(`${JSEARCH_URL}?${searchParams}`, {
      method: "GET",
      headers: {
        "x-rapidapi-host": "jsearch.p.rapidapi.com",
        // Never log this header
        "x-rapidapi-key": apiKey,
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      const upstreamErr: Error & { code?: string } = new Error(
        `Live job service returned HTTP ${response.status}. Check the JSearch subscription.`,
      );
      upstreamErr.code = "UPSTREAM_ERROR";
      throw upstreamErr;
    }

    rawPayload = await response.json();
  } catch (err: unknown) {
    // Re-throw our typed errors
    if (
      err instanceof Error &&
      (err as Error & { code?: string }).code === "UPSTREAM_ERROR"
    ) {
      throw err;
    }
    const upstreamErr: Error & { code?: string } = new Error(
      "Live job service could not be reached or returned invalid data.",
    );
    upstreamErr.code = "UPSTREAM_ERROR";
    throw upstreamErr;
  } finally {
    clearTimeout(timeoutId);
  }

  // Validate response shape
  if (typeof rawPayload !== "object" || rawPayload === null) {
    const shapeErr: Error & { code?: string } = new Error(
      "Live job service returned an unexpected response format.",
    );
    shapeErr.code = "UPSTREAM_ERROR";
    throw shapeErr;
  }

  const payload = rawPayload as Record<string, unknown>;
  const data = payload.data;

  if (!Array.isArray(data)) {
    const shapeErr: Error & { code?: string } = new Error(
      "Live job service returned an unexpected response format.",
    );
    shapeErr.code = "UPSTREAM_ERROR";
    throw shapeErr;
  }

  // Normalize, dedupe by applyUrl
  const seen = new Set<string>();
  const jobs: NormalizedJob[] = [];
  let index = 1;
  for (const item of data) {
    if (typeof item !== "object" || item === null) continue;
    const normalized = normalizeJSearchJob(
      item as Record<string, unknown>,
      index++,
    );
    if (!normalized) continue;
    if (seen.has(normalized.applyUrl)) continue;
    seen.add(normalized.applyUrl);
    jobs.push(normalized);
  }

  return jobs;
}

import { describe, it, expect } from "vitest";
import {
  buildJSearchQuery,
  safeExternalUrl,
  detectWorkMode,
  normalizeLocation,
  normalizeJobType,
  extractRequiredSkills,
  normalizeJSearchJob,
} from "../jobSearch";

describe("buildJSearchQuery", () => {
  it("defaults to latest jobs + Lahore + Pakistan when no params", () => {
    const query = buildJSearchQuery({});
    expect(query).toContain("Lahore");
    expect(query).toContain("Pakistan");
  });

  it("uses location when provided", () => {
    const query = buildJSearchQuery({ location: "Karachi" });
    expect(query).toContain("Karachi");
    expect(query).toContain("Pakistan");
  });

  it("incorporates jobType filter", () => {
    const query = buildJSearchQuery({ jobType: "Full-time", location: "Lahore" });
    expect(query).toContain("full time");
  });

  it("incorporates workMode filter", () => {
    const query = buildJSearchQuery({ workMode: "Remote", location: "Lahore" });
    expect(query).toContain("remote");
  });

  it("uses explicit query with location appended", () => {
    const query = buildJSearchQuery({
      query: "software engineer",
      location: "Islamabad",
    });
    expect(query).toContain("software engineer");
    expect(query).toContain("Islamabad");
    expect(query).toContain("Pakistan");
  });

  it("always includes Pakistan (default country PK focus)", () => {
    const query = buildJSearchQuery({ query: "developer", location: "Lahore" });
    expect(query).toContain("Pakistan");
  });
});

describe("safeExternalUrl", () => {
  it("returns null for null input", () => {
    expect(safeExternalUrl(null)).toBeNull();
  });

  it("returns null for undefined input", () => {
    expect(safeExternalUrl(undefined)).toBeNull();
  });

  it("returns null for empty string", () => {
    expect(safeExternalUrl("")).toBeNull();
  });

  it("allows http URLs", () => {
    expect(safeExternalUrl("http://example.com/jobs")).toBe("http://example.com/jobs");
  });

  it("allows https URLs", () => {
    expect(safeExternalUrl("https://jobs.example.com/apply")).toBe(
      "https://jobs.example.com/apply",
    );
  });

  it("rejects javascript: protocol", () => {
    expect(safeExternalUrl("javascript:alert(1)")).toBeNull();
  });

  it("rejects ftp: protocol", () => {
    expect(safeExternalUrl("ftp://example.com/file")).toBeNull();
  });

  it("rejects malformed URLs", () => {
    expect(safeExternalUrl("not-a-url")).toBeNull();
  });
});

describe("detectWorkMode", () => {
  it("returns Remote when job_is_remote is true", () => {
    expect(detectWorkMode({ job_is_remote: true })).toBe("Remote");
  });

  it("returns Remote when work_arrangement contains remote", () => {
    expect(detectWorkMode({ work_arrangement: "Full Remote" })).toBe("Remote");
  });

  it("returns Hybrid when work_arrangement contains hybrid", () => {
    expect(detectWorkMode({ work_arrangement: "Hybrid" })).toBe("Hybrid");
  });

  it("returns Hybrid when title contains hybrid", () => {
    expect(
      detectWorkMode({ job_title: "Hybrid Software Engineer", work_arrangement: "" }),
    ).toBe("Hybrid");
  });

  it("returns On-site when no remote/hybrid indicators", () => {
    expect(
      detectWorkMode({
        job_is_remote: false,
        work_arrangement: "",
        job_title: "Software Engineer",
        job_description: "Work from office",
      }),
    ).toBe("On-site");
  });
});

describe("normalizeLocation", () => {
  it("returns Remote for remote jobs", () => {
    expect(normalizeLocation({ job_is_remote: true })).toBe("Remote");
  });

  it("uses job_location when available", () => {
    expect(
      normalizeLocation({ job_is_remote: false, job_location: "Lahore, PK" }),
    ).toBe("Lahore, PK");
  });

  it("builds location from city/state/country", () => {
    expect(
      normalizeLocation({
        job_is_remote: false,
        job_city: "Karachi",
        job_country: "Pakistan",
      }),
    ).toBe("Karachi, Pakistan");
  });

  it("returns fallback when no location data", () => {
    expect(normalizeLocation({ job_is_remote: false })).toBe(
      "Location not specified",
    );
  });
});

describe("normalizeJobType", () => {
  it("maps FULLTIME to Full-time", () => {
    expect(normalizeJobType({ job_employment_type: "FULLTIME" })).toBe("Full-time");
  });

  it("maps PARTTIME to Part-time", () => {
    expect(normalizeJobType({ job_employment_type: "PARTTIME" })).toBe("Part-time");
  });

  it("maps CONTRACTOR to Contract", () => {
    expect(normalizeJobType({ job_employment_type: "CONTRACTOR" })).toBe("Contract");
  });

  it("maps INTERN to Internship", () => {
    expect(normalizeJobType({ job_employment_type: "INTERN" })).toBe("Internship");
  });

  it("returns uppercase fallback for null", () => {
    expect(normalizeJobType({ job_employment_type: null })).toBe("NOT SPECIFIED");
  });
});

describe("extractRequiredSkills", () => {
  it("combines job_required_skills, required_technologies, preferred_technologies", () => {
    const skills = extractRequiredSkills({
      job_required_skills: ["React", "Node.js"],
      required_technologies: ["PostgreSQL"],
      preferred_technologies: ["TypeScript"],
    });
    expect(skills).toContain("React");
    expect(skills).toContain("PostgreSQL");
    expect(skills).toContain("TypeScript");
  });

  it("deduplicates skills", () => {
    const skills = extractRequiredSkills({
      job_required_skills: ["React"],
      required_technologies: ["React"],
    });
    const reactCount = skills.filter((s) => s === "React").length;
    expect(reactCount).toBe(1);
  });

  it("returns empty array when no skills", () => {
    expect(extractRequiredSkills({})).toEqual([]);
  });
});

describe("normalizeJSearchJob", () => {
  const validJob = {
    job_title: "Software Engineer",
    employer_name: "ACME Corp",
    job_description: "Build great things",
    job_location: "Lahore",
    job_country: "PK",
    job_employment_type: "FULLTIME",
    job_is_remote: false,
    work_arrangement: "",
    job_apply_link: "https://acme.com/apply",
    job_publisher: "LinkedIn",
    job_required_skills: ["React", "TypeScript"],
    job_posted_at_datetime_utc: "2024-01-15T10:00:00Z",
  };

  it("normalizes a valid job record", () => {
    const result = normalizeJSearchJob(validJob, 1);
    expect(result).not.toBeNull();
    expect(result!.id).toBe("jsearch-1");
    expect(result!.title).toBe("Software Engineer");
    expect(result!.jobType).toBe("Full-time");
    expect(result!.applyUrl).toBe("https://acme.com/apply");
    expect(result!.requiredSkills).toContain("React");
  });

  it("returns null when apply URL is missing", () => {
    const result = normalizeJSearchJob(
      { ...validJob, job_apply_link: null, job_google_link: null },
      1,
    );
    expect(result).toBeNull();
  });

  it("returns null when apply URL has invalid protocol", () => {
    const result = normalizeJSearchJob(
      { ...validJob, job_apply_link: "ftp://insecure.com/apply" },
      1,
    );
    expect(result).toBeNull();
  });

  it("falls back to job_google_link when apply_link is missing", () => {
    const result = normalizeJSearchJob(
      {
        ...validJob,
        job_apply_link: null,
        job_google_link: "https://google.com/jobs/12345",
      },
      2,
    );
    expect(result).not.toBeNull();
    expect(result!.applyUrl).toBe("https://google.com/jobs/12345");
  });

  it("truncates title to 150 chars", () => {
    const longTitle = "A".repeat(200);
    const result = normalizeJSearchJob(
      { ...validJob, job_title: longTitle },
      1,
    );
    expect(result!.title.length).toBe(150);
  });

  it("handles malformed / missing fields gracefully", () => {
    const result = normalizeJSearchJob(
      { job_apply_link: "https://example.com/apply" },
      1,
    );
    expect(result).not.toBeNull();
    expect(result!.title).toBe("Untitled job");
    expect(result!.requiredSkills).toEqual([]);
    expect(result!.workMode).toBe("On-site");
  });
});

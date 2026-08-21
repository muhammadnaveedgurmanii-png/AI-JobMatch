/**
 * Matching service — pure, explainable job-resume skill matching.
 *
 * Scores use a small skill taxonomy before comparing the two sets. This lets
 * common equivalent spellings such as "ReactJS" and "React", or "Node" and
 * "Node.js", represent the same capability without producing an opaque score.
 * The percentage remains a transparent matched-job-skills / required-skills
 * calculation, rounded to the nearest integer.
 */

export interface MatchResult {
  matchPercentage: number;
  matchedSkills: string[];
  missingSkills: string[];
}

const SKILL_ALIASES: Readonly<Record<string, string>> = {
  "ai": "artificial intelligence",
  "amazon web services": "aws",
  "aws": "aws",
  "c sharp": "c#",
  "ci/cd": "ci cd",
  "ci-cd": "ci cd",
  "dot net": ".net",
  "dotnet": ".net",
  "ecmascript": "javascript",
  "gcp": "google cloud platform",
  "google cloud": "google cloud platform",
  "google cloud platform": "google cloud platform",
  "javascript": "javascript",
  "js": "javascript",
  "machine learning": "machine learning",
  "ml": "machine learning",
  "mongo": "mongodb",
  "next": "next.js",
  "nextjs": "next.js",
  "node": "node.js",
  "nodejs": "node.js",
  "postgres": "postgresql",
  "react.js": "react",
  "reactjs": "react",
  "ts": "typescript",
};

function normalizeSkill(skill: string): string {
  const lowered = skill.trim().toLowerCase().replace(/\s+/g, " ");
  return SKILL_ALIASES[lowered] ?? lowered;
}

/**
 * Normalize a skills list to a canonical set for skill-aware matching.
 * Handles text[] (from DB) or a comma-separated string (legacy).
 */
export function normalizeSkillsToSet(skills: string[] | string | null | undefined): Set<string> {
  if (!skills) return new Set();

  const arr = Array.isArray(skills)
    ? skills
    : String(skills)
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

  return new Set(arr.map(normalizeSkill).filter(Boolean));
}

/**
 * Calculate match between resume skills and job required skills.
 * Equivalent aliases are scored as the same skill, while the original job
 * wording remains visible in the matched and missing arrays.
 * Returns matchPercentage 0–100, sorted matched and missing skill arrays
 * (original casing from job skills).
 */
export function calculateMatch(
  resumeSkills: string[] | string | null | undefined,
  jobSkillsInput: string[] | string | null | undefined,
): MatchResult {
  const resumeSet = normalizeSkillsToSet(resumeSkills);
  const jobArr = Array.isArray(jobSkillsInput)
    ? jobSkillsInput
    : String(jobSkillsInput ?? "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

  const jobSkills = jobArr.reduce<Array<{ display: string; canonical: string }>>(
    (uniqueSkills, skill) => {
      const canonical = normalizeSkill(skill);

      if (
        canonical &&
        !uniqueSkills.some((item) => item.canonical === canonical)
      ) {
        uniqueSkills.push({ display: skill, canonical });
      }

      return uniqueSkills;
    },
    [],
  );

  if (jobSkills.length === 0) {
    return { matchPercentage: 0, matchedSkills: [], missingSkills: [] };
  }

  const matchedSkills: string[] = [];
  const missingSkills: string[] = [];

  for (const skill of jobSkills) {
    if (resumeSet.has(skill.canonical)) {
      matchedSkills.push(skill.display);
    } else {
      missingSkills.push(skill.display);
    }
  }

  const uniqueMatched = matchedSkills.sort();
  const uniqueMissing = missingSkills.sort();

  const matchPercentage = Math.round(
    (uniqueMatched.length / jobSkills.length) * 100,
  );

  return {
    matchPercentage,
    matchedSkills: uniqueMatched,
    missingSkills: uniqueMissing,
  };
}

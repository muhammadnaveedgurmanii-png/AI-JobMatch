/**
 * Matching service — pure functions for job-resume skill matching.
 * Preserves the semantics from the Python source (matching_service.py):
 * - Case-insensitive set-based matching
 * - match_percentage = matched / total job skills * 100, rounded
 * - 0% if job has no required skills (no zero-match jobs are returned)
 */

export interface MatchResult {
  matchPercentage: number;
  matchedSkills: string[];
  missingSkills: string[];
}

/**
 * Normalize a skills list to a lowercase set for case-insensitive matching.
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

  return new Set(arr.map((s) => s.trim().toLowerCase()).filter(Boolean));
}

/**
 * Calculate match between resume skills and job required skills.
 * Returns matchPercentage 0–100, sorted matched and missing skill arrays
 * (original casing from job skills).
 */
export function calculateMatch(
  resumeSkills: string[] | string | null | undefined,
  jobSkills: string[] | string | null | undefined,
): MatchResult {
  const resumeSet = normalizeSkillsToSet(resumeSkills);
  const jobArr = Array.isArray(jobSkills)
    ? jobSkills
    : String(jobSkills ?? "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

  const jobSet = new Set(jobArr.map((s) => s.toLowerCase()));

  if (jobSet.size === 0) {
    return { matchPercentage: 0, matchedSkills: [], missingSkills: [] };
  }

  const matchedSkills: string[] = [];
  const missingSkills: string[] = [];

  for (const skill of jobArr) {
    if (resumeSet.has(skill.toLowerCase())) {
      matchedSkills.push(skill);
    } else {
      missingSkills.push(skill);
    }
  }

  // Dedupe (in case jobArr has duplicates)
  const uniqueMatched = [...new Set(matchedSkills)].sort();
  const uniqueMissing = [...new Set(missingSkills)].sort();

  const matchPercentage = Math.round(
    (uniqueMatched.length / jobSet.size) * 100,
  );

  return {
    matchPercentage,
    matchedSkills: uniqueMatched,
    missingSkills: uniqueMissing,
  };
}

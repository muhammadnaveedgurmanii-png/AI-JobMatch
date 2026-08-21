import { describe, it, expect } from "vitest";
import {
  normalizeSkillsToSet,
  calculateMatch,
} from "../matchingService.js";

describe("normalizeSkillsToSet", () => {
  it("returns empty set for null", () => {
    expect(normalizeSkillsToSet(null)).toEqual(new Set());
  });

  it("returns empty set for undefined", () => {
    expect(normalizeSkillsToSet(undefined)).toEqual(new Set());
  });

  it("lowercases all skills from array", () => {
    const result = normalizeSkillsToSet(["React", "Node.js", "TypeScript"]);
    expect(result).toEqual(new Set(["react", "node.js", "typescript"]));
  });

  it("handles comma-separated string (legacy format)", () => {
    const result = normalizeSkillsToSet("Python, Django, REST APIs");
    expect(result).toEqual(new Set(["python", "django", "rest apis"]));
  });

  it("deduplicates case-insensitively", () => {
    const result = normalizeSkillsToSet(["React", "react", "REACT"]);
    expect(result.size).toBe(1);
    expect(result.has("react")).toBe(true);
  });

  it("filters empty strings", () => {
    const result = normalizeSkillsToSet(["React", "", "  ", "Node.js"]);
    expect(result.size).toBe(2);
  });
});

describe("calculateMatch", () => {
  it("returns 0 when job has no required skills", () => {
    const result = calculateMatch(["React", "Node.js"], []);
    expect(result.matchPercentage).toBe(0);
    expect(result.matchedSkills).toHaveLength(0);
    expect(result.missingSkills).toHaveLength(0);
  });

  it("returns 100% when all job skills matched", () => {
    const result = calculateMatch(
      ["React", "Node.js", "TypeScript"],
      ["React", "Node.js"],
    );
    expect(result.matchPercentage).toBe(100);
    expect(result.matchedSkills).toEqual(["Node.js", "React"]);
    expect(result.missingSkills).toHaveLength(0);
  });

  it("returns 0% when no skills match", () => {
    const result = calculateMatch(["Python", "Django"], ["React", "Node.js"]);
    expect(result.matchPercentage).toBe(0);
    expect(result.matchedSkills).toHaveLength(0);
    expect(result.missingSkills).toHaveLength(2);
  });

  it("is case-insensitive", () => {
    const result = calculateMatch(["react", "node.js"], ["React", "Node.js"]);
    expect(result.matchPercentage).toBe(100);
  });

  it("correctly computes partial match and rounds", () => {
    // 1 of 3 skills matched = 33.33% → rounds to 33
    const result = calculateMatch(["React"], ["React", "Node.js", "Python"]);
    expect(result.matchPercentage).toBe(33);
    expect(result.matchedSkills).toEqual(["React"]);
    expect(result.missingSkills).toEqual(["Node.js", "Python"]);
  });

  it("handles null resume skills", () => {
    const result = calculateMatch(null, ["React", "Node.js"]);
    expect(result.matchPercentage).toBe(0);
    expect(result.missingSkills).toHaveLength(2);
  });

  it("handles null job skills", () => {
    const result = calculateMatch(["React"], null);
    expect(result.matchPercentage).toBe(0);
  });

  it("deduplicates job skills before scoring", () => {
    // Job has duplicate skills — score should not inflate
    const result = calculateMatch(["React"], ["React", "React", "Node.js"]);
    // unique job skills: React, Node.js (size 2), matched: 1
    expect(result.matchPercentage).toBe(50);
  });

  it("returns sorted matched and missing skills", () => {
    const result = calculateMatch(
      ["TypeScript", "React"],
      ["React", "Node.js", "TypeScript", "Docker"],
    );
    expect(result.matchedSkills).toEqual(["React", "TypeScript"]);
    expect(result.missingSkills).toEqual(["Docker", "Node.js"]);
  });
});

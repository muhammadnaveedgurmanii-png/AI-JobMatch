import { describe, expect, it } from "vitest";
import { parseResumeText } from "../resumeParser";

describe("parseResumeText", () => {
  it("extracts common resume sections and deduplicates skills", () => {
    const parsed = parseResumeText(`
      Professional Summary
      Full-stack engineer building reliable products.
      Technical Skills
      React, TypeScript, PostgreSQL, react
      Work Experience
      Software Engineer at Example Co.
      Education
      BS Computer Science
    `);

    expect(parsed.professionalSummary).toContain("Full-stack engineer");
    expect(parsed.skills).toEqual(
      expect.arrayContaining(["React", "TypeScript", "PostgreSQL"]),
    );
    expect(parsed.skills.filter((skill) => skill.toLowerCase() === "react")).toHaveLength(1);
    expect(parsed.experience).toContain("Software Engineer");
    expect(parsed.education).toContain("BS Computer Science");
  });

  it("falls back to introductory text when no summary heading exists", () => {
    const parsed = parseResumeText("A product designer focused on accessible systems.");
    expect(parsed.professionalSummary).toContain("product designer");
  });

  it("detects known skills outside a skills section", () => {
    const parsed = parseResumeText("Built services with Python, FastAPI and PostgreSQL.");
    expect(parsed.skills).toEqual(
      expect.arrayContaining(["Python", "FastAPI", "PostgreSQL"]),
    );
  });
});
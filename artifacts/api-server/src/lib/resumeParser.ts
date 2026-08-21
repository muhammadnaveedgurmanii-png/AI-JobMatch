export type ParsedResume = {
  professionalSummary: string;
  skills: string[];
  experience: string;
  education: string;
};

const SECTION_NAMES = [
  "summary",
  "professional summary",
  "profile",
  "professional profile",
  "objective",
  "career objective",
  "skills",
  "technical skills",
  "core skills",
  "competencies",
  "experience",
  "work experience",
  "professional experience",
  "employment history",
  "education",
  "academic background",
  "qualifications",
] as const;

const KNOWN_SKILLS = [
  "React",
  "Next.js",
  "TypeScript",
  "JavaScript",
  "Node.js",
  "Express",
  "Python",
  "Django",
  "FastAPI",
  "Java",
  "C#",
  "C++",
  "PHP",
  "Laravel",
  "SQL",
  "PostgreSQL",
  "MySQL",
  "MongoDB",
  "HTML",
  "CSS",
  "Tailwind CSS",
  "Git",
  "Docker",
  "Kubernetes",
  "AWS",
  "Azure",
  "GCP",
  "Figma",
  "Project Management",
  "Data Analysis",
  "Machine Learning",
  "Artificial Intelligence",
] as const;

const SUMMARY_HEADERS = new Set([
  "summary",
  "professional summary",
  "profile",
  "professional profile",
  "objective",
  "career objective",
]);
const SKILLS_HEADERS = new Set([
  "skills",
  "technical skills",
  "core skills",
  "competencies",
]);
const EXPERIENCE_HEADERS = new Set([
  "experience",
  "work experience",
  "professional experience",
  "employment history",
]);
const EDUCATION_HEADERS = new Set([
  "education",
  "academic background",
  "qualifications",
]);

function normalizeHeader(line: string): string {
  return line
    .trim()
    .replace(/^[#•●▪◦\-–—:\s]+|[:\s]+$/g, "")
    .toLowerCase();
}

function isSectionHeader(line: string): boolean {
  return SECTION_NAMES.includes(normalizeHeader(line) as (typeof SECTION_NAMES)[number]);
}

function getSection(lines: string[], headers: Set<string>): string {
  const start = lines.findIndex((line) => headers.has(normalizeHeader(line)));
  if (start < 0) return "";

  const section: string[] = [];
  for (let index = start + 1; index < lines.length; index += 1) {
    if (isSectionHeader(lines[index])) break;
    section.push(lines[index]);
  }
  return section.join("\n").trim();
}

function uniqueSkills(values: string[]): string[] {
  const result: string[] = [];
  const seen = new Set<string>();
  for (const value of values) {
    const cleaned = value
      .replace(/^[•●▪◦\-–—\s]+/, "")
      .replace(/\s+/g, " ")
      .trim();
    const key = cleaned.toLowerCase();
    if (
      cleaned.length < 2 ||
      cleaned.length > 60 ||
      cleaned.split(" ").length > 6 ||
      seen.has(key)
    ) {
      continue;
    }
    seen.add(key);
    result.push(cleaned);
    if (result.length === 40) break;
  }
  return result;
}

export function parseResumeText(text: string): ParsedResume {
  const normalizedText = text.replace(/\r/g, "").replace(/\u0000/g, "");
  const lines = normalizedText
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const summarySection = getSection(lines, SUMMARY_HEADERS);
  const skillsSection = getSection(lines, SKILLS_HEADERS);
  const experience = getSection(lines, EXPERIENCE_HEADERS).slice(0, 8_000);
  const education = getSection(lines, EDUCATION_HEADERS).slice(0, 4_000);

  const skillCandidates = skillsSection
    .split(/[,;|•●▪◦\n]+/)
    .map((skill) => skill.trim())
    .filter(Boolean);

  const searchable = normalizedText.toLowerCase();
  for (const knownSkill of KNOWN_SKILLS) {
    if (searchable.includes(knownSkill.toLowerCase())) {
      skillCandidates.push(knownSkill);
    }
  }

  const fallbackSummary = lines
    .filter((line) => !isSectionHeader(line))
    .slice(0, 8)
    .join(" ");

  return {
    professionalSummary: (summarySection || fallbackSummary).slice(0, 2_000),
    skills: uniqueSkills(skillCandidates),
    experience,
    education,
  };
}
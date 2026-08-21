/**
 * Idempotent seed script for local_jobs table.
 * Seeds 3 realistic Pakistan-based jobs (Lahore, Islamabad, Karachi).
 * Mix of work modes and job types.
 *
 * Usage (after schema push):
 *   pnpm --filter @workspace/api-server exec tsx ../../scripts/seed-local-jobs.ts
 *
 * Or from repo root:
 *   DATABASE_URL=... npx tsx scripts/seed-local-jobs.ts
 */

import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { localJobsTable } from "../lib/db/src/schema/localJobs";
import { eq } from "drizzle-orm";

const { Pool } = pg;

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  throw new Error("DATABASE_URL must be set");
}

const pool = new Pool({ connectionString: DATABASE_URL });
const db = drizzle(pool);

const SEED_JOBS = [
  {
    title: "Senior Software Engineer",
    company: "Systems Limited",
    description:
      "Join our growing engineering team to build scalable web applications. You will work on our core product using React, Node.js, and PostgreSQL in a collaborative remote-friendly environment.",
    location: "Lahore",
    country: "PK",
    jobType: "Full-time",
    workMode: "Hybrid",
    requiredSkills: ["React", "Node.js", "PostgreSQL", "TypeScript", "REST APIs"],
    applyUrl: "https://www.linkedin.com/company/systems-limited/jobs/",
    source: "local",
  },
  {
    title: "Backend Developer (Django / Python)",
    company: "NetSol Technologies",
    description:
      "We are looking for a backend developer with strong Python and Django experience to help us deliver financial software solutions for our global clients.",
    location: "Islamabad",
    country: "PK",
    jobType: "Full-time",
    workMode: "On-site",
    requiredSkills: ["Python", "Django", "PostgreSQL", "REST APIs", "Docker"],
    applyUrl: "https://www.linkedin.com/company/netsol-technologies/jobs/",
    source: "local",
  },
  {
    title: "Frontend React Intern",
    company: "Arbisoft",
    description:
      "A fantastic opportunity for fresh graduates to work remotely on real-world projects. You will be mentored by senior engineers and contribute to live products from day one.",
    location: "Karachi",
    country: "PK",
    jobType: "Internship",
    workMode: "Remote",
    requiredSkills: ["React", "JavaScript", "HTML", "CSS", "Git"],
    applyUrl: "https://arbisoft.com/careers/",
    source: "local",
  },
];

async function seed() {
  console.log("Seeding local_jobs (idempotent)…");

  for (const job of SEED_JOBS) {
    // Check by title + company (idempotency key)
    const existing = await db
      .select({ id: localJobsTable.id })
      .from(localJobsTable)
      .where(eq(localJobsTable.title, job.title));

    if (existing.length > 0) {
      console.log(`  skip (exists): ${job.title}`);
      continue;
    }

    await db.insert(localJobsTable).values(job);
    console.log(`  inserted: ${job.title} @ ${job.company} (${job.location})`);
  }

  console.log("Seed complete.");
  await pool.end();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});

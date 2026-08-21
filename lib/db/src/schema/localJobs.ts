import {
  pgTable,
  serial,
  text,
  varchar,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const localJobsTable = pgTable(
  "local_jobs",
  {
    id: serial("id").primaryKey(),
    title: varchar("title", { length: 150 }).notNull(),
    company: varchar("company", { length: 150 }).notNull(),
    description: text("description").notNull().default(""),
    location: varchar("location", { length: 100 }).notNull().default("Lahore"),
    country: varchar("country", { length: 10 }).default("PK"),
    jobType: varchar("job_type", { length: 50 }).notNull().default("Full-time"),
    workMode: varchar("work_mode", { length: 50 }).notNull().default("On-site"),
    /** text[] stored as Postgres array */
    requiredSkills: text("required_skills").array().notNull().default([]),
    applyUrl: varchar("apply_url", { length: 500 }).notNull(),
    source: varchar("source", { length: 100 }).notNull().default("local"),
    postedAt: timestamp("posted_at", { withTimezone: true }).defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("local_jobs_location_idx").on(t.location),
    index("local_jobs_job_type_idx").on(t.jobType),
    index("local_jobs_work_mode_idx").on(t.workMode),
  ],
);

export const insertLocalJobSchema = createInsertSchema(localJobsTable).omit({
  id: true,
  createdAt: true,
});

export type InsertLocalJob = z.infer<typeof insertLocalJobSchema>;
export type LocalJob = typeof localJobsTable.$inferSelect;

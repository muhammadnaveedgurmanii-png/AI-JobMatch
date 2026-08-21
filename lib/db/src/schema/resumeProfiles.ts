import {
  pgTable,
  serial,
  integer,
  text,
  varchar,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { candidateProfilesTable } from "./candidateProfiles";

export const resumeProfilesTable = pgTable(
  "resume_profiles",
  {
    id: serial("id").primaryKey(),
    /** FK → candidate_profiles(id) — one resume per candidate */
    candidateId: integer("candidate_id")
      .notNull()
      .unique()
      .references(() => candidateProfilesTable.id, { onDelete: "cascade" }),
    professionalSummary: text("professional_summary").notNull().default(""),
    /** text[] stored as Postgres array */
    skills: text("skills").array().notNull().default([]),
    education: text("education").notNull().default(""),
    experience: text("experience").notNull().default(""),
    /** GCS object path after upload completion */
    resumeFilePath: varchar("resume_file_path", { length: 500 }),
    resumeFileName: varchar("resume_file_name", { length: 255 }),
    /** First 500 chars of extracted PDF text */
    extractedTextPreview: text("extracted_text_preview"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [index("resume_profiles_candidate_idx").on(t.candidateId)],
);

export const insertResumeProfileSchema = createInsertSchema(
  resumeProfilesTable,
).omit({ id: true, createdAt: true, updatedAt: true });

export type InsertResumeProfile = z.infer<typeof insertResumeProfileSchema>;
export type ResumeProfile = typeof resumeProfilesTable.$inferSelect;

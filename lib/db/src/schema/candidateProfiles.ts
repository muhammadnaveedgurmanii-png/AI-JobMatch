import {
  pgTable,
  serial,
  varchar,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const candidateProfilesTable = pgTable(
  "candidate_profiles",
  {
    id: serial("id").primaryKey(),
    /** Clerk user ID — unique ownership key */
    clerkUserId: varchar("clerk_user_id", { length: 255 }).notNull().unique(),
    fullName: varchar("full_name", { length: 100 }).notNull(),
    /** Stored as lowercase for case-insensitive uniqueness (enforced at application boundary) */
    email: varchar("email", { length: 120 }).notNull(),
    preferredLocation: varchar("preferred_location", { length: 100 })
      .notNull()
      .default("Lahore"),
    country: varchar("country", { length: 2 }).notNull().default("PK"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    uniqueIndex("candidate_profiles_email_lower_idx").on(
      // lowercase index for case-insensitive uniqueness
      t.email,
    ),
  ],
);

export const insertCandidateProfileSchema = createInsertSchema(
  candidateProfilesTable,
).omit({ id: true, createdAt: true, updatedAt: true });

export type InsertCandidateProfile = z.infer<
  typeof insertCandidateProfileSchema
>;
export type CandidateProfile = typeof candidateProfilesTable.$inferSelect;

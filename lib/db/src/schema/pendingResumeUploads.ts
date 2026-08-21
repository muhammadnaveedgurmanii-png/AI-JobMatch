import {
  pgTable,
  serial,
  integer,
  varchar,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { candidateProfilesTable } from "./candidateProfiles";

export const pendingResumeUploadsTable = pgTable(
  "pending_resume_uploads",
  {
    id: serial("id").primaryKey(),
    /** FK → candidate_profiles(id) */
    candidateId: integer("candidate_id")
      .notNull()
      .references(() => candidateProfilesTable.id, { onDelete: "cascade" }),
    objectPath: varchar("object_path", { length: 500 }).notNull(),
    fileName: varchar("file_name", { length: 255 }).notNull(),
    /** Expiry for the pre-signed URL (15 min after creation) */
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("pending_resume_uploads_candidate_idx").on(t.candidateId),
    index("pending_resume_uploads_object_path_idx").on(t.objectPath),
  ],
);

export const insertPendingResumeUploadSchema = createInsertSchema(
  pendingResumeUploadsTable,
).omit({ id: true, createdAt: true });

export type InsertPendingResumeUpload = z.infer<
  typeof insertPendingResumeUploadSchema
>;
export type PendingResumeUpload =
  typeof pendingResumeUploadsTable.$inferSelect;

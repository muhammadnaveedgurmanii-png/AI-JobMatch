CREATE TABLE IF NOT EXISTS "candidate_profiles" (
	"id" serial PRIMARY KEY NOT NULL,
	"clerk_user_id" varchar(255) NOT NULL,
	"full_name" varchar(100) NOT NULL,
	"email" varchar(120) NOT NULL,
	"preferred_location" varchar(100) DEFAULT 'Lahore' NOT NULL,
	"country" varchar(2) DEFAULT 'PK' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "candidate_profiles_clerk_user_id_unique" UNIQUE("clerk_user_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "resume_profiles" (
	"id" serial PRIMARY KEY NOT NULL,
	"candidate_id" integer NOT NULL,
	"professional_summary" text DEFAULT '' NOT NULL,
	"skills" text[] DEFAULT '{}' NOT NULL,
	"education" text DEFAULT '' NOT NULL,
	"experience" text DEFAULT '' NOT NULL,
	"resume_file_path" varchar(500),
	"resume_file_name" varchar(255),
	"extracted_text_preview" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "resume_profiles_candidate_id_unique" UNIQUE("candidate_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "local_jobs" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(150) NOT NULL,
	"company" varchar(150) NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"location" varchar(100) DEFAULT 'Lahore' NOT NULL,
	"country" varchar(10) DEFAULT 'PK',
	"job_type" varchar(50) DEFAULT 'Full-time' NOT NULL,
	"work_mode" varchar(50) DEFAULT 'On-site' NOT NULL,
	"required_skills" text[] DEFAULT '{}' NOT NULL,
	"apply_url" varchar(500) NOT NULL,
	"source" varchar(100) DEFAULT 'local' NOT NULL,
	"posted_at" timestamp with time zone DEFAULT now(),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "pending_resume_uploads" (
	"id" serial PRIMARY KEY NOT NULL,
	"candidate_id" integer NOT NULL,
	"object_path" varchar(500) NOT NULL,
	"file_name" varchar(255) NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "resume_profiles" ADD CONSTRAINT "resume_profiles_candidate_id_candidate_profiles_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "public"."candidate_profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "pending_resume_uploads" ADD CONSTRAINT "pending_resume_uploads_candidate_id_candidate_profiles_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "public"."candidate_profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "candidate_profiles_email_lower_idx" ON "candidate_profiles" USING btree ("email");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "resume_profiles_candidate_idx" ON "resume_profiles" USING btree ("candidate_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "local_jobs_location_idx" ON "local_jobs" USING btree ("location");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "local_jobs_job_type_idx" ON "local_jobs" USING btree ("job_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "local_jobs_work_mode_idx" ON "local_jobs" USING btree ("work_mode");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "pending_resume_uploads_candidate_idx" ON "pending_resume_uploads" USING btree ("candidate_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "pending_resume_uploads_object_path_idx" ON "pending_resume_uploads" USING btree ("object_path");
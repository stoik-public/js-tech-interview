-- IF NOT EXISTS: the migrator creates the schema first, for its own history table.
CREATE SCHEMA IF NOT EXISTS "protect";
--> statement-breakpoint
CREATE TYPE "protect"."AssessmentStatus" AS ENUM('draft', 'published');--> statement-breakpoint
CREATE TYPE "protect"."Band" AS ENUM('Critical', 'Weak', 'Good');--> statement-breakpoint
CREATE TABLE "protect"."assessment" (
	"id" text PRIMARY KEY NOT NULL,
	"companyId" text NOT NULL,
	"status" "protect"."AssessmentStatus" DEFAULT 'draft' NOT NULL,
	"phishingClickRatePct" integer NOT NULL,
	"leakedPasswords" integer NOT NULL,
	"unhandledAlerts" integer NOT NULL,
	"score" integer NOT NULL,
	"band" "protect"."Band" NOT NULL,
	"scoreBreakdown" jsonb NOT NULL,
	"publishedAt" timestamp (3),
	"createdAt" timestamp (3) DEFAULT now() NOT NULL,
	"updatedAt" timestamp (3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "protect"."company" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"createdAt" timestamp (3) DEFAULT now() NOT NULL,
	"updatedAt" timestamp (3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "protect"."assessment" ADD CONSTRAINT "assessment_companyId_company_id_fk" FOREIGN KEY ("companyId") REFERENCES "protect"."company"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX "assessment_companyId_idx" ON "protect"."assessment" USING btree ("companyId");--> statement-breakpoint
CREATE UNIQUE INDEX "assessment_one_draft_per_company_key" ON "protect"."assessment" USING btree ("companyId") WHERE "protect"."assessment"."status" = 'draft';
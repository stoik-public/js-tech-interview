-- IF NOT EXISTS: the migrator creates the schema first, for its own history table.
CREATE SCHEMA IF NOT EXISTS "distribution";
--> statement-breakpoint
CREATE TYPE "distribution"."CoverageOption" AS ENUM('ransomware_extortion', 'social_engineering_fraud', 'business_interruption', 'regulatory_fines');--> statement-breakpoint
CREATE TYPE "distribution"."QuoteStatus" AS ENUM('draft', 'signed');--> statement-breakpoint
CREATE TABLE "distribution"."company" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"annualRevenueCents" bigint NOT NULL,
	"createdAt" timestamp (3) DEFAULT now() NOT NULL,
	"updatedAt" timestamp (3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "distribution"."contract" (
	"id" text PRIMARY KEY NOT NULL,
	"quoteId" text NOT NULL,
	"companyId" text NOT NULL,
	"startDate" date NOT NULL,
	"endDate" date NOT NULL,
	"premiumCents" integer NOT NULL,
	"coverageLimitCents" integer NOT NULL,
	"deductibleCents" integer NOT NULL,
	"options" "distribution"."CoverageOption"[] NOT NULL,
	"createdAt" timestamp (3) DEFAULT now() NOT NULL,
	"updatedAt" timestamp (3) DEFAULT now() NOT NULL,
	CONSTRAINT "contract_quoteId_key" UNIQUE("quoteId")
);
--> statement-breakpoint
CREATE TABLE "distribution"."quote" (
	"id" text PRIMARY KEY NOT NULL,
	"companyId" text NOT NULL,
	"status" "distribution"."QuoteStatus" DEFAULT 'draft' NOT NULL,
	"coverageLimitCents" integer NOT NULL,
	"deductibleCents" integer NOT NULL,
	"options" "distribution"."CoverageOption"[] NOT NULL,
	"premiumCents" integer NOT NULL,
	"pricingBreakdown" jsonb NOT NULL,
	"createdAt" timestamp (3) DEFAULT now() NOT NULL,
	"updatedAt" timestamp (3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "distribution"."contract" ADD CONSTRAINT "contract_quoteId_quote_id_fk" FOREIGN KEY ("quoteId") REFERENCES "distribution"."quote"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "distribution"."contract" ADD CONSTRAINT "contract_companyId_company_id_fk" FOREIGN KEY ("companyId") REFERENCES "distribution"."company"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "distribution"."quote" ADD CONSTRAINT "quote_companyId_company_id_fk" FOREIGN KEY ("companyId") REFERENCES "distribution"."company"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX "contract_companyId_idx" ON "distribution"."contract" USING btree ("companyId");--> statement-breakpoint
CREATE INDEX "quote_companyId_idx" ON "distribution"."quote" USING btree ("companyId");
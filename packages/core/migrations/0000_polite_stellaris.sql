CREATE TYPE "public"."campaign_type" AS ENUM('Cost per Order', 'Cost per Click', 'Buy One Get One');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "campaign_schedule" (
	"id" text PRIMARY KEY NOT NULL,
	"campaign_id" text,
	"day_of_week" integer[] NOT NULL,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "campaigns" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"campaign_type" "campaign_type" NOT NULL,
	"time_created" timestamp (3) DEFAULT now() NOT NULL,
	"time_updated" timestamp (3) DEFAULT now() NOT NULL,
	"time_deleted" timestamp (3),
	CONSTRAINT "campaigns_name_unique" UNIQUE("name")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "campaign_schedule" ADD CONSTRAINT "campaign_schedule_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

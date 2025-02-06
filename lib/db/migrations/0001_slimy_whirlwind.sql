CREATE TABLE IF NOT EXISTS "verified_slips" (
	"id" serial PRIMARY KEY NOT NULL,
	"trans_ref" text NOT NULL,
	"amount" numeric NOT NULL,
	"verified_at" timestamp DEFAULT now() NOT NULL,
	"user_id" integer,
	CONSTRAINT "verified_slips_trans_ref_unique" UNIQUE("trans_ref")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "verified_slips" ADD CONSTRAINT "verified_slips_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

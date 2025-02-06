ALTER TABLE "deposit_limits" DROP CONSTRAINT "deposit_limits_created_by_users_id_fk";
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "deposit_limit_id" integer;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "users" ADD CONSTRAINT "users_deposit_limit_id_deposit_limits_id_fk" FOREIGN KEY ("deposit_limit_id") REFERENCES "public"."deposit_limits"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

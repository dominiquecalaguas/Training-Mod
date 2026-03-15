ALTER TABLE "auth_user" ADD COLUMN "first_name" text;--> statement-breakpoint
ALTER TABLE "auth_user" ADD COLUMN "last_name" text;--> statement-breakpoint
UPDATE "auth_user" SET "first_name" = "name" WHERE "first_name" IS NULL AND "name" IS NOT NULL;
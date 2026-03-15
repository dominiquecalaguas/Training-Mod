ALTER TABLE "auth_user" ALTER COLUMN "role" SET DEFAULT 'new_hire';--> statement-breakpoint
UPDATE "auth_user" SET role = 'employee' WHERE role = 'user';--> statement-breakpoint
ALTER TABLE "courses" ADD COLUMN "is_onboarding" boolean DEFAULT false NOT NULL;
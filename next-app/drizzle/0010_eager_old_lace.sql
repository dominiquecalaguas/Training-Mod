CREATE TABLE "oauth_grants" (
	"id" text PRIMARY KEY NOT NULL,
	"kind" text NOT NULL,
	"client_id" text NOT NULL,
	"resource" text NOT NULL,
	"redirect_uri" text,
	"token_hash" text,
	"state_hash" text,
	"code_challenge" text,
	"auth0_code_verifier" text,
	"auth0_nonce" text,
	"oauth_user_id" text,
	"expires_at" timestamp with time zone NOT NULL,
	"consumed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "oauth_users" (
	"id" text PRIMARY KEY NOT NULL,
	"issuer" text NOT NULL,
	"subject" text NOT NULL,
	"email" text,
	"name" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "oauth_grants" ADD CONSTRAINT "oauth_grants_oauth_user_id_oauth_users_id_fk" FOREIGN KEY ("oauth_user_id") REFERENCES "public"."oauth_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "oauth_grants_token_hash_unique" ON "oauth_grants" USING btree ("token_hash");--> statement-breakpoint
CREATE UNIQUE INDEX "oauth_grants_state_hash_unique" ON "oauth_grants" USING btree ("state_hash");--> statement-breakpoint
CREATE INDEX "oauth_grants_expires_at_idx" ON "oauth_grants" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "oauth_grants_user_id_idx" ON "oauth_grants" USING btree ("oauth_user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "oauth_users_identity_unique" ON "oauth_users" USING btree ("issuer","subject");
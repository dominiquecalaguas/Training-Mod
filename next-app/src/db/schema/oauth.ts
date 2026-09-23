import { index, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

export const oauthUsers = pgTable(
  "oauth_users",
  {
    id: text("id").primaryKey(),
    issuer: text("issuer").notNull(),
    subject: text("subject").notNull(),
    email: text("email"),
    name: text("name"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    identityUnique: uniqueIndex("oauth_users_identity_unique").on(table.issuer, table.subject),
  }),
);

export const oauthGrants = pgTable(
  "oauth_grants",
  {
    id: text("id").primaryKey(),
    kind: text("kind").notNull(),
    clientId: text("client_id").notNull(),
    resource: text("resource").notNull(),
    redirectUri: text("redirect_uri"),
    tokenHash: text("token_hash"),
    stateHash: text("state_hash"),
    codeChallenge: text("code_challenge"),
    auth0CodeVerifier: text("auth0_code_verifier"),
    auth0Nonce: text("auth0_nonce"),
    oauthUserId: text("oauth_user_id").references(() => oauthUsers.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    consumedAt: timestamp("consumed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    tokenHashUnique: uniqueIndex("oauth_grants_token_hash_unique").on(table.tokenHash),
    stateHashUnique: uniqueIndex("oauth_grants_state_hash_unique").on(table.stateHash),
    expiresAtIdx: index("oauth_grants_expires_at_idx").on(table.expiresAt),
    oauthUserIdIdx: index("oauth_grants_user_id_idx").on(table.oauthUserId),
  }),
);

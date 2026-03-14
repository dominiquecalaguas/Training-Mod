import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { authUser } from "./auth-user";

// Lucia v3 session table: id, expires_at, user_id
export const userSession = pgTable("user_session", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => authUser.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
});

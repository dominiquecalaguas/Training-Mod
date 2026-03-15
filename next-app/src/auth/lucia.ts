import { DrizzlePostgreSQLAdapter } from "@lucia-auth/adapter-drizzle";
import { Lucia } from "lucia";
import { cookies } from "next/headers";
import { cache } from "react";
import { db } from "@/db/client";
import { authUser, userSession } from "@/db/schema";

const adapter = new DrizzlePostgreSQLAdapter(db, userSession, authUser);

export const lucia = new Lucia(adapter, {
  sessionCookie: {
    expires: false,
    attributes: {
      secure: process.env.NODE_ENV === "production",
    },
  },
  getUserAttributes: (attributes) => {
    const attrs = attributes as {
      first_name?: string | null;
      last_name?: string | null;
      firstName?: string | null;
      lastName?: string | null;
      name?: string | null;
      email: string;
      role: string;
    };
    const firstName = attrs.firstName ?? attrs.first_name ?? null;
    const lastName = attrs.lastName ?? attrs.last_name ?? null;
    const displayName =
      [firstName, lastName].filter(Boolean).join(" ") ||
      attributes.name ||
      attributes.email;
    return {
      email: attributes.email,
      name: attributes.name,
      firstName,
      lastName,
      displayName,
      role: attributes.role,
    };
  },
});

export type DatabaseUserAttributes = {
  email: string;
  name: string | null;
  first_name: string | null;
  last_name: string | null;
  password_hash: string;
  role: string;
  created_at: Date;
};

declare module "lucia" {
  interface Register {
    Lucia: typeof lucia;
    DatabaseUserAttributes: DatabaseUserAttributes;
  }
}

export const getPageSession = cache(async () => {
  const sessionId = (await cookies()).get(lucia.sessionCookieName)?.value ?? null;
  if (!sessionId) {
    return { user: null, session: null };
  }
  const result = await lucia.validateSession(sessionId);
  try {
    if (result.session?.fresh) {
      const sessionCookie = lucia.createSessionCookie(result.session.id);
      (await cookies()).set(
        sessionCookie.name,
        sessionCookie.value,
        sessionCookie.attributes,
      );
    }
    if (!result.session) {
      const sessionCookie = lucia.createBlankSessionCookie();
      (await cookies()).set(
        sessionCookie.name,
        sessionCookie.value,
        sessionCookie.attributes,
      );
    }
  } catch {
    // Next.js throws when setting cookies during render
  }
  return result;
});

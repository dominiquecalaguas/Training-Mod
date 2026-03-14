import { db } from "@/db/client";
import { authUser } from "@/db/schema";
import { lucia } from "@/auth/lucia";
import { verify } from "@node-rs/argon2";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getPostHogClient } from "@/lib/posthog-server";

const ARGON2_OPTIONS = {
  memoryCost: 19456,
  timeCost: 2,
  outputLen: 32,
  parallelism: 1,
} as const;

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 255;
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 },
    );
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!email || !isValidEmail(email)) {
    return NextResponse.json(
      { error: "Invalid email address" },
      { status: 400 },
    );
  }
  if (!password || password.length > 255) {
    return NextResponse.json(
      { error: "Invalid password" },
      { status: 400 },
    );
  }

  const users = await db
    .select()
    .from(authUser)
    .where(eq(authUser.email, email))
    .limit(1);

  if (users.length === 0) {
    return NextResponse.json(
      { error: "Incorrect email or password" },
      { status: 401 },
    );
  }

  const user = users[0];
  const validPassword = await verify(user.passwordHash, password, ARGON2_OPTIONS);
  if (!validPassword) {
    return NextResponse.json(
      { error: "Incorrect email or password" },
      { status: 401 },
    );
  }

  try {
    const session = await lucia.createSession(user.id, {});
    const sessionCookie = lucia.createSessionCookie(session.id);
    (await cookies()).set(
      sessionCookie.name,
      sessionCookie.value,
      sessionCookie.attributes,
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Login session error:", err);
    return NextResponse.json(
      {
        error: "Sign-in failed",
        ...(process.env.NODE_ENV === "development" && { detail: message }),
      },
      { status: 500 },
    );
  }

  try {
    const phDistinctId = request.headers.get("x-posthog-distinct-id") ?? email;
    const posthog = getPostHogClient();
    posthog.identify({ distinctId: email, properties: { email } });
    posthog.capture({
      distinctId: phDistinctId,
      event: "user_signed_in",
      properties: { email, $set: { email } },
    });
  } catch {
    // Don't fail login if analytics fails
  }

  return NextResponse.json({ ok: true });
}

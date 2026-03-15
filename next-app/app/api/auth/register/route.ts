import { db } from "@/db/client";
import { authUser } from "@/db/schema";
import { lucia } from "@/auth/lucia";
import { hash } from "@node-rs/argon2";
import { generateIdFromEntropySize } from "lucia";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import crypto from "node:crypto";
import { getPostHogClient } from "@/lib/posthog-server";

const ARGON2_OPTIONS = {
  memoryCost: 19456,
  timeCost: 2,
  outputLen: 32,
  parallelism: 1,
} as const;

function constantTimeCompare(a: string, b: string): boolean {
  const aBuf = Buffer.from(a, "utf8");
  const bBuf = Buffer.from(b, "utf8");
  if (aBuf.length !== bBuf.length) return false;
  return crypto.timingSafeEqual(aBuf, bBuf);
}

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

  const {
    secretKey,
    firstName,
    lastName,
    email,
    password,
  }: {
    secretKey?: unknown;
    firstName?: unknown;
    lastName?: unknown;
    email?: unknown;
    password?: unknown;
  } = body;

  const expectedKey = process.env.REGISTRATION_SECRET_KEY ?? "";
  if (!expectedKey) {
    return NextResponse.json(
      { error: "Registration is not configured" },
      { status: 503 },
    );
  }

  if (typeof secretKey !== "string" || !constantTimeCompare(secretKey.trim(), expectedKey.trim())) {
    return NextResponse.json(
      { error: "Invalid or missing registration key" },
      { status: 403 },
    );
  }

  const firstNameStr = typeof firstName === "string" ? firstName.trim() : "";
  const lastNameStr = typeof lastName === "string" ? lastName.trim() : "";
  const emailStr = typeof email === "string" ? email.trim().toLowerCase() : "";
  const passwordStr = typeof password === "string" ? password : "";

  if (!firstNameStr || firstNameStr.length > 255) {
    return NextResponse.json(
      { error: "First name is required and must be at most 255 characters" },
      { status: 400 },
    );
  }
  if (!lastNameStr || lastNameStr.length > 255) {
    return NextResponse.json(
      { error: "Last name is required and must be at most 255 characters" },
      { status: 400 },
    );
  }
  if (!isValidEmail(emailStr)) {
    return NextResponse.json(
      { error: "Invalid email address" },
      { status: 400 },
    );
  }
  if (passwordStr.length < 6 || passwordStr.length > 255) {
    return NextResponse.json(
      { error: "Password must be between 6 and 255 characters" },
      { status: 400 },
    );
  }

  const existing = await db
    .select({ id: authUser.id })
    .from(authUser)
    .where(eq(authUser.email, emailStr))
    .limit(1);

  if (existing.length > 0) {
    return NextResponse.json(
      { error: "An account with this email already exists" },
      { status: 409 },
    );
  }

  const passwordHash = await hash(passwordStr, ARGON2_OPTIONS);
  const userId = generateIdFromEntropySize(10);

  const displayName = [firstNameStr, lastNameStr].filter(Boolean).join(" ");
  await db.insert(authUser).values({
    id: userId,
    email: emailStr,
    name: displayName,
    firstName: firstNameStr,
    lastName: lastNameStr,
    passwordHash,
    role: "new_hire",
  });

  if (process.env.SENDGRID_API_KEY) {
    try {
      const sg = await import("@sendgrid/mail");
      sg.default.setApiKey(process.env.SENDGRID_API_KEY);
      await sg.default.send({
        to: emailStr,
        from: process.env.SENDGRID_FROM_EMAIL ?? "noreply@example.com",
        subject: "Welcome",
        text: `Welcome, ${displayName}. Your account has been created.`,
      });
    } catch (err) {
      console.error("SendGrid send failed:", err);
    }
  }

  const session = await lucia.createSession(userId, {});
  const sessionCookie = lucia.createSessionCookie(session.id);
  (await cookies()).set(
    sessionCookie.name,
    sessionCookie.value,
    sessionCookie.attributes,
  );

  const phDistinctId = request.headers.get("x-posthog-distinct-id") ?? emailStr;
  const posthog = getPostHogClient();
  posthog.identify({ distinctId: emailStr, properties: { email: emailStr, name: displayName } });
  posthog.capture({ distinctId: phDistinctId, event: "user_signed_up", properties: { email: emailStr, name: displayName, $set: { email: emailStr, name: displayName } } });

  return NextResponse.json({ ok: true }, { status: 201 });
}

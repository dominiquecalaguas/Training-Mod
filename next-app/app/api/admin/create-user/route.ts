/**
 * Intentionally disabled; do not enable in production.
 * Only for initial admin seeding in controlled environments.
 * This route is kept behind a code constant that is always false.
 */
const ENABLE_ADMIN_CREATE_API = false;

import { db } from "@/db/client";
import { authUser } from "@/db/schema";
import { hash } from "@node-rs/argon2";
import { generateIdFromEntropySize } from "lucia";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";

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
  if (!ENABLE_ADMIN_CREATE_API) {
    return NextResponse.json({ error: "Not Found" }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 },
    );
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!name || name.length > 255) {
    return NextResponse.json(
      { error: "Name is required and must be at most 255 characters" },
      { status: 400 },
    );
  }
  if (!isValidEmail(email)) {
    return NextResponse.json(
      { error: "Invalid email address" },
      { status: 400 },
    );
  }
  if (password.length < 6 || password.length > 255) {
    return NextResponse.json(
      { error: "Password must be between 6 and 255 characters" },
      { status: 400 },
    );
  }

  const existing = await db
    .select({ id: authUser.id })
    .from(authUser)
    .where(eq(authUser.email, email))
    .limit(1);

  if (existing.length > 0) {
    return NextResponse.json(
      { error: "An account with this email already exists" },
      { status: 409 },
    );
  }

  const passwordHash = await hash(password, ARGON2_OPTIONS);
  const userId = generateIdFromEntropySize(10);

  await db.insert(authUser).values({
    id: userId,
    email,
    name,
    passwordHash,
    role: "admin",
  });

  return NextResponse.json({ ok: true, userId }, { status: 201 });
}

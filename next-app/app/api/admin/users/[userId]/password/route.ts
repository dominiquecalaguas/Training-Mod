import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { requireAdmin } from "@/auth/require-admin";
import { db } from "@/db/client";
import { authUser } from "@/db/schema";
import { hash } from "@node-rs/argon2";

const ARGON2_OPTIONS = {
  memoryCost: 19456,
  timeCost: 2,
  outputLen: 32,
  parallelism: 1,
} as const;

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  const [, err] = await requireAdmin();
  if (err) return err;

  const { userId: pathUserId } = await params;
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object" || typeof body.password !== "string") {
    return NextResponse.json(
      { error: "Body must include password (string)" },
      { status: 400 },
    );
  }

  const password = body.password;
  if (password.length < 6 || password.length > 255) {
    return NextResponse.json(
      { error: "Password must be between 6 and 255 characters" },
      { status: 400 },
    );
  }

  const email =
    typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const userId = email
    ? null
    : pathUserId
      ? pathUserId
      : null;

  if (!userId && !email) {
    return NextResponse.json(
      { error: "Provide userId in the path or email in the body" },
      { status: 400 },
    );
  }

  const passwordHash = await hash(password, ARGON2_OPTIONS);

  try {
    const result = email
      ? await db
          .update(authUser)
          .set({ passwordHash })
          .where(eq(authUser.email, email))
          .returning({ id: authUser.id })
      : await db
          .update(authUser)
          .set({ passwordHash })
          .where(eq(authUser.id, userId!))
          .returning({ id: authUser.id });

    if (result.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

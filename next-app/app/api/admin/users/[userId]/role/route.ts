import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { requireAdmin } from "@/auth/require-admin";
import { db } from "@/db/client";
import { authUser } from "@/db/schema";

const VALID_ROLES = ["admin", "new_hire", "employee"] as const;

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  const [, err] = await requireAdmin();
  if (err) return err;

  const { userId } = await params;
  if (!userId) {
    return NextResponse.json({ error: "Missing userId" }, { status: 400 });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object" || typeof body.role !== "string") {
    return NextResponse.json(
      { error: "Body must include role (admin | new_hire | employee)" },
      { status: 400 },
    );
  }

  const role = body.role as string;
  if (!VALID_ROLES.includes(role as (typeof VALID_ROLES)[number])) {
    return NextResponse.json(
      { error: "role must be one of: admin, new_hire, employee" },
      { status: 400 },
    );
  }

  try {
    const result = await db
      .update(authUser)
      .set({ role })
      .where(eq(authUser.id, userId))
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

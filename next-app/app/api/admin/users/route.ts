import { NextResponse } from "next/server";
import { asc } from "drizzle-orm";
import { requireAdmin } from "@/auth/require-admin";
import { db } from "@/db/client";
import { authUser } from "@/db/schema";

export async function GET() {
  const [, err] = await requireAdmin();
  if (err) return err;

  try {
    const rows = await db
      .select({
        id: authUser.id,
        firstName: authUser.firstName,
        lastName: authUser.lastName,
        email: authUser.email,
        role: authUser.role,
      })
      .from(authUser)
      .orderBy(asc(authUser.email));

    return NextResponse.json(rows);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

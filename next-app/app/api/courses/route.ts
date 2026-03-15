import { NextResponse } from "next/server";
import { and, asc, eq, isNull } from "drizzle-orm";
import { getPageSession } from "@/auth/lucia";
import { db } from "@/db/client";
import { courses } from "@/db/schema";

export async function GET() {
  try {
    const { user } = await getPageSession();
    const isNewHire = user?.role === "new_hire";

    const rows = await db
      .select()
      .from(courses)
      .where(
        isNewHire
          ? and(isNull(courses.archivedAt), eq(courses.isOnboarding, true))
          : isNull(courses.archivedAt),
      )
      .orderBy(asc(courses.order));

    return NextResponse.json(rows);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

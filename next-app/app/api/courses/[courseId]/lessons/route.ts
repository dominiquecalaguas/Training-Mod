import { NextRequest, NextResponse } from "next/server";
import { and, asc, eq, isNull } from "drizzle-orm";
import { getPageSession } from "@/auth/lucia";
import { db } from "@/db/client";
import { courses, lessons } from "@/db/schema";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ courseId: string }> },
) {
  const paramsData = await params;
  const courseId = Number(paramsData.courseId);
  if (Number.isNaN(courseId)) {
    return NextResponse.json({ error: "Invalid courseId" }, { status: 400 });
  }

  try {
    const { user } = await getPageSession();
    if (user?.role === "new_hire") {
      const [course] = await db
        .select({ isOnboarding: courses.isOnboarding })
        .from(courses)
        .where(eq(courses.id, courseId))
        .limit(1);
      if (!course?.isOnboarding) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    const rows = await db
      .select()
      .from(lessons)
      .where(and(eq(lessons.courseId, courseId), isNull(lessons.archivedAt)))
      .orderBy(asc(lessons.order));

    return NextResponse.json(rows);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

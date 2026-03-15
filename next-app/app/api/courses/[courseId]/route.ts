import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getPageSession } from "@/auth/lucia";
import { db } from "@/db/client";
import { courses } from "@/db/schema";

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
    const [course] = await db
      .select()
      .from(courses)
      .where(eq(courses.id, courseId))
      .limit(1);

    if (!course || course.archivedAt != null) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const { user } = await getPageSession();
    if (user?.role === "new_hire" && !course.isOnboarding) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(course);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
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

    if (!course) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(course);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

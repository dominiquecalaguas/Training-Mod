import { NextRequest, NextResponse } from "next/server";
import { getLessonProgressForCourse } from "@//lib/progress";

export async function GET(req: NextRequest) {
  const deviceToken = req.nextUrl.searchParams.get("deviceToken");
  const courseIdParam = req.nextUrl.searchParams.get("courseId");

  if (!deviceToken || !courseIdParam) {
    return NextResponse.json(
      { error: "Missing deviceToken or courseId" },
      { status: 400 },
    );
  }

  const courseId = Number(courseIdParam);
  if (Number.isNaN(courseId)) {
    return NextResponse.json({ error: "Invalid courseId" }, { status: 400 });
  }

  const map = await getLessonProgressForCourse({ deviceToken, courseId });
  const obj: Record<number, boolean> = {};
  for (const [lessonId, done] of map.entries()) {
    obj[lessonId] = done;
  }

  return NextResponse.json(obj);
}


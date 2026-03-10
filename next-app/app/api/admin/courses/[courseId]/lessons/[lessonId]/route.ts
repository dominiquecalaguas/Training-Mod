import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { lessons } from "@/db/schema";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ courseId: string; lessonId: string }> },
) {
  const paramsData = await params;
  const courseId = Number(paramsData.courseId);
  const lessonId = Number(paramsData.lessonId);
  if (Number.isNaN(courseId) || Number.isNaN(lessonId)) {
    return NextResponse.json({ error: "Invalid ids" }, { status: 400 });
  }

  try {
    const [lesson] = await db
      .select()
      .from(lessons)
      .where(and(eq(lessons.id, lessonId), eq(lessons.courseId, courseId)))
      .limit(1);

    if (!lesson) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(lesson);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ courseId: string; lessonId: string }> },
) {
  const paramsData = await params;
  const courseId = Number(paramsData.courseId);
  const lessonId = Number(paramsData.lessonId);
  if (Number.isNaN(courseId) || Number.isNaN(lessonId)) {
    return NextResponse.json({ error: "Invalid ids" }, { status: 400 });
  }

  const body = await req.json().catch(() => null);
  if (!body || typeof body.title !== "string") {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const title = body.title.trim();
  if (!title) {
    return NextResponse.json({ error: "Missing title" }, { status: 400 });
  }

  const content =
    typeof body.content === "string" ? body.content : "";
  const order = Number(body.order ?? 0);

  try {
    await db
      .update(lessons)
      .set({
        title,
        content,
        order,
      })
      .where(and(eq(lessons.id, lessonId), eq(lessons.courseId, courseId)));

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ courseId: string; lessonId: string }> },
) {
  const paramsData = await params;
  const courseId = Number(paramsData.courseId);
  const lessonId = Number(paramsData.lessonId);
  if (Number.isNaN(courseId) || Number.isNaN(lessonId)) {
    return NextResponse.json({ error: "Invalid ids" }, { status: 400 });
  }

  try {
    await db
      .delete(lessons)
      .where(and(eq(lessons.id, lessonId), eq(lessons.courseId, courseId)));
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

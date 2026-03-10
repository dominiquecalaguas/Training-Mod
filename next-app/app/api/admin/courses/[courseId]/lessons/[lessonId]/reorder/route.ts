import { NextResponse } from "next/server";
import { and, asc, desc, eq, gt, lt } from "drizzle-orm";
import { db } from "@/db/client";
import { lessons } from "@/db/schema";

export async function POST(
  req: Request,
  { params }: { params: { courseId: string; lessonId: string } },
) {
  const courseId = Number(params.courseId);
  const lessonId = Number(params.lessonId);
  if (Number.isNaN(courseId) || Number.isNaN(lessonId)) {
    return NextResponse.json({ error: "Invalid ids" }, { status: 400 });
  }

  const body = await req.json().catch(() => null);
  const direction = typeof body?.direction === "string" ? body.direction : "";
  if (direction !== "up" && direction !== "down") {
    return NextResponse.json({ error: "Invalid direction" }, { status: 400 });
  }

  try {
    const [current] = await db
      .select()
      .from(lessons)
      .where(and(eq(lessons.id, lessonId), eq(lessons.courseId, courseId)))
      .limit(1);
    if (!current) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const targetWhere =
      direction === "up"
        ? and(
            eq(lessons.courseId, courseId),
            lt(lessons.order, current.order),
          )
        : and(
            eq(lessons.courseId, courseId),
            gt(lessons.order, current.order),
          );

    const [neighbor] = await db
      .select()
      .from(lessons)
      .where(targetWhere)
      .orderBy(direction === "up" ? desc(lessons.order) : asc(lessons.order))
      .limit(1);

    if (!neighbor) {
      return NextResponse.json({ ok: true });
    }

    await db
      .update(lessons)
      .set({ order: neighbor.order })
      .where(eq(lessons.id, current.id));

    await db
      .update(lessons)
      .set({ order: current.order })
      .where(eq(lessons.id, neighbor.id));

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

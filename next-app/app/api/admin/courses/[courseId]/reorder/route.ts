import { NextRequest, NextResponse } from "next/server";
import { asc, desc, eq, gt, lt } from "drizzle-orm";
import { db } from "@/db/client";
import { courses } from "@/db/schema";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ courseId: string }> },
) {
  const paramsData = await params;
  const courseId = Number(paramsData.courseId);
  if (Number.isNaN(courseId)) {
    return NextResponse.json({ error: "Invalid courseId" }, { status: 400 });
  }

  const body = await req.json().catch(() => null);
  const direction = typeof body?.direction === "string" ? body.direction : "";
  if (direction !== "up" && direction !== "down") {
    return NextResponse.json({ error: "Invalid direction" }, { status: 400 });
  }

  try {
    const [current] = await db
      .select()
      .from(courses)
      .where(eq(courses.id, courseId))
      .limit(1);

    if (!current) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const targetWhere =
      direction === "up"
        ? lt(courses.order, current.order)
        : gt(courses.order, current.order);

    const [neighbor] = await db
      .select()
      .from(courses)
      .where(targetWhere)
      .orderBy(direction === "up" ? desc(courses.order) : asc(courses.order))
      .limit(1);

    if (!neighbor) {
      return NextResponse.json({ ok: true });
    }

    await db
      .update(courses)
      .set({ order: neighbor.order })
      .where(eq(courses.id, current.id));

    await db
      .update(courses)
      .set({ order: current.order })
      .where(eq(courses.id, neighbor.id));

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

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

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ courseId: string }> },
) {
  const paramsData = await params;
  const courseId = Number(paramsData.courseId);
  if (Number.isNaN(courseId)) {
    return NextResponse.json({ error: "Invalid courseId" }, { status: 400 });
  }

  const body = await req.json().catch(() => null);
  if (!body || typeof body.title !== "string") {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const title = body.title.trim();
  if (!title) {
    return NextResponse.json({ error: "Missing title" }, { status: 400 });
  }

  const description =
    typeof body.description === "string" ? body.description.trim() : "";
  const thumbnailUrl =
    typeof body.thumbnailUrl === "string" ? body.thumbnailUrl.trim() : "";
  const order = Number(body.order ?? 0);

  try {
    await db
      .update(courses)
      .set({
        title,
        description: description || null,
        thumbnailUrl: thumbnailUrl || null,
        order,
      })
      .where(eq(courses.id, courseId));

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ courseId: string }> },
) {
  const paramsData = await params;
  const courseId = Number(paramsData.courseId);
  if (Number.isNaN(courseId)) {
    return NextResponse.json({ error: "Invalid courseId" }, { status: 400 });
  }

  try {
    await db.delete(courses).where(eq(courses.id, courseId));
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

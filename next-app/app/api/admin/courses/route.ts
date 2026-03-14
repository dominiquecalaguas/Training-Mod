import { NextResponse } from "next/server";
import { asc, count, eq, sql } from "drizzle-orm";
import { requireAdmin } from "@/auth/require-admin";
import { db } from "@/db/client";
import { courses, lessons } from "@/db/schema";

const lessonCounts = db
  .select({
    courseId: lessons.courseId,
    lessonCount: count().as("lesson_count"),
  })
  .from(lessons)
  .groupBy(lessons.courseId)
  .as("lesson_counts");

export async function GET() {
  const [, err] = await requireAdmin();
  if (err) return err;
  try {
    const result = await db
      .select({
        id: courses.id,
        title: courses.title,
        description: courses.description,
        thumbnailUrl: courses.thumbnailUrl,
        order: courses.order,
        createdAt: courses.createdAt,
        updatedAt: courses.updatedAt,
        lessonCount: sql<number>`coalesce(${lessonCounts.lessonCount}, 0)`,
      })
      .from(courses)
      .leftJoin(lessonCounts, eq(courses.id, lessonCounts.courseId))
      .orderBy(asc(courses.order));

    const rows = result.map((row) => {
      const { lessonCount, ...course } = row;
      return {
        course,
        lessonCount: Number(lessonCount),
      };
    });

    return NextResponse.json(rows);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    const hint =
      message.includes("does not exist") || message.includes("relation")
        ? "Run migrations: npm run db:migrate"
        : "Check DATABASE_URL in .env and that the database is reachable.";
    return NextResponse.json({ error: message, hint }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const [, err] = await requireAdmin();
  if (err) return err;
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
    const [inserted] = await db
      .insert(courses)
      .values({
        title,
        description: description || null,
        thumbnailUrl: thumbnailUrl || null,
        order,
      })
      .returning();

    return NextResponse.json({ id: inserted.id });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

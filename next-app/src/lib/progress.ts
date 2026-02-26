import { and, countDistinct, eq, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { lessons, progress } from "@/db/schema";

export async function markLessonComplete(opts: {
  deviceToken: string;
  courseId: number;
  lessonId: number;
}) {
  const { deviceToken, courseId, lessonId } = opts;

  await db
    .insert(progress)
    .values({
      deviceToken,
      courseId,
      lessonId,
    })
    .onConflictDoUpdate({
      target: [progress.deviceToken, progress.lessonId],
      set: { completedAt: sql`now()` },
    });
}

export async function getCourseProgressForDevice(deviceToken: string) {
  const totals = await db
    .select({
      courseId: lessons.courseId,
      totalLessons: countDistinct(lessons.id).as("total_lessons"),
    })
    .from(lessons)
    .groupBy(lessons.courseId);

  const completed = await db
    .select({
      courseId: lessons.courseId,
      completedLessons: countDistinct(lessons.id).as("completed_lessons"),
    })
    .from(progress)
    .innerJoin(lessons, eq(progress.lessonId, lessons.id))
    .where(eq(progress.deviceToken, deviceToken))
    .groupBy(lessons.courseId);

  const byCourse: Record<
    number,
    { totalLessons: number; completedLessons: number }
  > = {};

  for (const row of totals) {
    byCourse[row.courseId] = {
      totalLessons: Number(row.totalLessons),
      completedLessons: 0,
    };
  }

  for (const row of completed) {
    const existing = byCourse[row.courseId];
    if (!existing) continue;
    existing.completedLessons = Number(row.completedLessons);
  }

  return byCourse;
}

export async function getLessonProgressForCourse(opts: {
  deviceToken: string;
  courseId: number;
}) {
  const rows = await db
    .select({
      lessonId: lessons.id,
      completedAt: progress.completedAt,
    })
    .from(lessons)
    .leftJoin(
      progress,
      and(
        eq(lessons.id, progress.lessonId),
        eq(progress.deviceToken, opts.deviceToken),
      ),
    )
    .where(eq(lessons.courseId, opts.courseId));

  const map = new Map<number, boolean>();
  for (const row of rows) {
    map.set(row.lessonId, row.completedAt != null);
  }
  return map;
}


import Link from "next/link";
import { Suspense } from "react";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { courses, lessons } from "@/db/schema";
import { count } from "drizzle-orm";
import { DraggableCourseList } from "./DraggableCourseList";

const lessonCounts = db
  .select({
    courseId: lessons.courseId,
    lessonCount: count().as("lesson_count"),
  })
  .from(lessons)
  .groupBy(lessons.courseId)
  .as("lesson_counts");

async function CourseListView() {
  let rows: Array<{
    course: typeof courses.$inferSelect;
    lessonCount: number;
  }>;

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
      .orderBy(courses.order);

    rows = result.map((r) => {
      const { lessonCount, ...course } = r;
      return {
        course,
        lessonCount: Number(lessonCount),
      };
    });
  } catch (err) {
    const msg =
      err instanceof Error ? err.message : String(err);
    const hint =
      msg.includes("does not exist") || msg.includes("relation")
        ? " Run migrations: npm run db:migrate"
        : " Check DATABASE_URL in .env and that the database is reachable.";
    throw new Error(`Database error: ${msg}.${hint}`);
  }

  return (
    <section className="rounded-xl border border-zinc-200 bg-white">
      <div className="border-b border-zinc-200 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
        Existing courses
      </div>
      <DraggableCourseList rows={rows} />
    </section>
  );
}

function CourseListFallback() {
  return (
    <section className="rounded-xl border border-zinc-200 bg-white">
      <div className="border-b border-zinc-200 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
        Existing courses
      </div>
      <div className="px-4 py-8 flex items-center justify-center">
        <p className="text-sm text-zinc-500">Loading courses…</p>
      </div>
    </section>
  );
}

export default async function AdminCoursesPage() {
  return (
    <div className="flex flex-col gap-6">
      <section className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold tracking-tight">Courses</h2>
        <Link
          href="/admin/courses/new"
          className="inline-flex items-center rounded-full bg-zinc-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-zinc-800"
        >
          New course
        </Link>
      </section>
      <Suspense fallback={<CourseListFallback />}>
        <CourseListView />
      </Suspense>
    </div>
  );
}


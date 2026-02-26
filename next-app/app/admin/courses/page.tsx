import Link from "next/link";
import { Suspense } from "react";
import { eq, sql } from "drizzle-orm";
import { db } from "@/src/db/client";
import { courses, lessons } from "@/src/db/schema";
import {
  createCourse,
  deleteCourse,
  reorderCourse,
  seedCheckInProceduresCourse,
} from "../actions";
import { DeleteCourseForm } from "./DeleteCourseForm";
import { count } from "drizzle-orm";

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
      {rows.length === 0 ? (
        <p className="px-4 py-6 text-sm text-zinc-500">
          No courses yet. Create your first course above.
        </p>
      ) : (
        <ul className="divide-y divide-zinc-100 text-sm">
          {rows.map((row) => (
            <li
              key={row.course.id}
              className="flex items-center gap-4 px-4 py-3"
            >
              <div className="w-10 text-xs font-mono text-zinc-500">
                {row.course.order}
              </div>
              <div className="flex flex-1 flex-col">
                <span className="font-medium text-zinc-900">
                  {row.course.title}
                </span>
                <span className="text-xs text-zinc-500">
                  {row.lessonCount} lessons
                </span>
              </div>
              <div className="flex items-center gap-2">
                <form action={reorderCourse}>
                  <input type="hidden" name="id" value={row.course.id} />
                  <input type="hidden" name="direction" value="up" />
                  <button
                    type="submit"
                    className="rounded-full border border-zinc-200 px-2 py-1 text-xs text-zinc-600 hover:bg-zinc-100"
                  >
                    ↑
                  </button>
                </form>
                <form action={reorderCourse}>
                  <input type="hidden" name="id" value={row.course.id} />
                  <input type="hidden" name="direction" value="down" />
                  <button
                    type="submit"
                    className="rounded-full border border-zinc-200 px-2 py-1 text-xs text-zinc-600 hover:bg-zinc-100"
                  >
                    ↓
                  </button>
                </form>
                <Link
                  href={`/admin/courses/${row.course.id}/edit`}
                  className="rounded-full border border-zinc-200 px-3 py-1 text-xs text-zinc-700 hover:bg-zinc-100"
                >
                  Edit
                </Link>
                <Link
                  href={`/admin/courses/${row.course.id}/lessons`}
                  className="rounded-full border border-zinc-200 px-3 py-1 text-xs text-zinc-700 hover:bg-zinc-100"
                >
                  Lessons
                </Link>
                <DeleteCourseForm action={deleteCourse} courseId={row.course.id} />
              </div>
            </li>
          ))}
        </ul>
      )}
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
      <section className="rounded-xl border border-dashed border-zinc-300 bg-white/60 p-4">
        <h3 className="text-sm font-semibold text-zinc-900">
          Quick create course
        </h3>
        <form action={createCourse} className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="text-xs font-medium text-zinc-700 sm:col-span-2">
            Title
            <input
              type="text"
              name="title"
              required
              className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900"
            />
          </label>
          <label className="text-xs font-medium text-zinc-700 sm:col-span-2">
            Description
            <textarea
              name="description"
              rows={3}
              className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900"
            />
          </label>
          <label className="text-xs font-medium text-zinc-700">
            Thumbnail URL
            <input
              type="url"
              name="thumbnailUrl"
              className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900"
            />
          </label>
          <label className="text-xs font-medium text-zinc-700">
            Order
            <input
              type="number"
              name="order"
              defaultValue={1}
              className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900"
            />
          </label>
          <div className="sm:col-span-2">
            <button
              type="submit"
              className="inline-flex items-center rounded-full bg-zinc-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-zinc-800"
            >
              Create course
            </button>
          </div>
        </form>
      </section>
      <section className="rounded-xl border border-dashed border-zinc-300 bg-white/60 p-4">
        <h3 className="text-sm font-semibold text-zinc-900">
          Seed &quot;Check-In Procedures&quot; course
        </h3>
        <p className="mt-1 text-xs text-zinc-600">
          Use this to create or update the &quot;Check-In Procedures&quot;
          training course with its full set of lessons and content.
        </p>
        <form action={seedCheckInProceduresCourse} className="mt-3">
          <button
            type="submit"
            className="inline-flex items-center rounded-full border border-zinc-300 bg-white px-4 py-1.5 text-sm font-medium text-zinc-800 hover:bg-zinc-100"
          >
            Seed course and lessons
          </button>
        </form>
      </section>
    </div>
  );
}


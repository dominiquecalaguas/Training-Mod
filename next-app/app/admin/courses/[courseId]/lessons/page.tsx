import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/db/client";
import { courses, lessons } from "@/db/schema";
import { asc, eq } from "drizzle-orm";
import {
  createLesson,
  deleteLesson,
  reorderLesson,
} from "../../../actions";
import { DeleteLessonForm } from "./DeleteLessonForm";

export default async function AdminLessonsPage({
  params,
  searchParams,
}: {
  params: Promise<{ courseId: string }>;
  searchParams: Promise<{ created?: string }>;
}) {
  const { courseId: courseIdParam } = await params;
  const courseId = Number(courseIdParam);
  if (Number.isNaN(courseId)) notFound();

  const [course] = await db
    .select()
    .from(courses)
    .where(eq(courses.id, courseId))
    .limit(1);
  if (!course) notFound();

  const courseLessons = await db
    .select()
    .from(lessons)
    .where(eq(lessons.courseId, courseId))
    .orderBy(asc(lessons.order));

  const { created } = await searchParams;

  return (
    <div className="flex flex-col gap-6">
      {created === "1" && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          Course created. Add content to each lesson below.
        </div>
      )}
      <section className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">
            Lessons for {course.title}
          </h2>
          <p className="mt-1 text-xs text-zinc-600">
            Manage lesson content and ordering.
          </p>
        </div>
        <Link
          href={`/admin/courses/${courseId}/lessons/new`}
          className="inline-flex items-center rounded-full bg-zinc-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-zinc-800"
        >
          New lesson
        </Link>
      </section>
      <section className="rounded-xl border border-zinc-200 bg-white">
        <div className="border-b border-zinc-200 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
          Existing lessons
        </div>
        {courseLessons.length === 0 ? (
          <p className="px-4 py-6 text-sm text-zinc-500">
            No lessons yet. Create your first lesson above.
          </p>
        ) : (
          <ul className="divide-y divide-zinc-100 text-sm">
            {courseLessons.map((lesson) => (
              <li
                key={lesson.id}
                className="flex items-center gap-4 px-4 py-3"
              >
                <div className="w-10 text-xs font-mono text-zinc-500">
                  {lesson.order}
                </div>
                <div className="flex flex-1 flex-col">
                  <span className="font-medium text-zinc-900">
                    {lesson.title}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <form action={reorderLesson}>
                    <input type="hidden" name="id" value={lesson.id} />
                    <input type="hidden" name="courseId" value={courseId} />
                    <input type="hidden" name="direction" value="up" />
                    <button
                      type="submit"
                      className="rounded-full border border-zinc-200 px-2 py-1 text-xs text-zinc-600 hover:bg-zinc-100"
                    >
                      ↑
                    </button>
                  </form>
                  <form action={reorderLesson}>
                    <input type="hidden" name="id" value={lesson.id} />
                    <input type="hidden" name="courseId" value={courseId} />
                    <input type="hidden" name="direction" value="down" />
                    <button
                      type="submit"
                      className="rounded-full border border-zinc-200 px-2 py-1 text-xs text-zinc-600 hover:bg-zinc-100"
                    >
                      ↓
                    </button>
                  </form>
                  <Link
                    href={`/admin/courses/${courseId}/lessons/${lesson.id}/edit`}
                    className="rounded-full border border-zinc-200 px-3 py-1 text-xs text-zinc-700 hover:bg-zinc-100"
                  >
                    Edit
                  </Link>
                  <DeleteLessonForm
                    deleteLesson={deleteLesson}
                    lessonId={lesson.id}
                    courseId={courseId}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
      <section className="rounded-xl border border-dashed border-zinc-300 bg-white/60 p-4">
        <h3 className="text-sm font-semibold text-zinc-900">
          Quick create lesson
        </h3>
        <form action={createLesson} className="mt-3 grid gap-3 sm:grid-cols-2">
          <input type="hidden" name="courseId" value={courseId} />
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
            Markdown content
            <textarea
              name="content"
              rows={6}
              className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900"
            />
          </label>
          <label className="text-xs font-medium text-zinc-700">
            Order
            <input
              type="number"
              name="order"
              defaultValue={courseLessons.length + 1}
              className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900"
            />
          </label>
          <div className="sm:col-span-2">
            <button
              type="submit"
              className="inline-flex items-center rounded-full bg-zinc-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-zinc-800"
            >
              Create lesson
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}


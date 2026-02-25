import { notFound } from "next/navigation";
import { db } from "@/src/db/client";
import { courses, lessons } from "@/src/db/schema";
import { and, asc, eq } from "drizzle-orm";
import { updateLesson } from "../../../../../actions";

export default async function EditLessonPage({
  params,
}: {
  params: { courseId: string; lessonId: string };
}) {
  const courseId = Number(params.courseId);
  const lessonId = Number(params.lessonId);
  if (Number.isNaN(courseId) || Number.isNaN(lessonId)) notFound();

  const [course] = await db
    .select()
    .from(courses)
    .where(eq(courses.id, courseId))
    .limit(1);
  if (!course) notFound();

  const [lesson] = await db
    .select()
    .from(lessons)
    .where(and(eq(lessons.id, lessonId), eq(lessons.courseId, courseId)))
    .limit(1);
  if (!lesson) notFound();

  const siblings = await db
    .select()
    .from(lessons)
    .where(eq(lessons.courseId, courseId))
    .orderBy(asc(lessons.order));

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-6">
      <h2 className="text-lg font-semibold tracking-tight">
        Edit lesson in {course.title}
      </h2>
      <form action={updateLesson} className="mt-4 grid gap-4 sm:grid-cols-2">
        <input type="hidden" name="id" value={lesson.id} />
        <input type="hidden" name="courseId" value={courseId} />
        <label className="text-xs font-medium text-zinc-700 sm:col-span-2">
          Title
          <input
            type="text"
            name="title"
            defaultValue={lesson.title}
            required
            className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900"
          />
        </label>
        <label className="text-xs font-medium text-zinc-700 sm:col-span-2">
          Markdown content
          <textarea
            name="content"
            defaultValue={lesson.content}
            rows={8}
            className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900"
          />
        </label>
        <label className="text-xs font-medium text-zinc-700">
          Order
          <input
            type="number"
            name="order"
            defaultValue={lesson.order}
            min={1}
            max={siblings.length}
            className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900"
          />
        </label>
        <div className="sm:col-span-2">
          <button
            type="submit"
            className="inline-flex items-center rounded-full bg-zinc-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-zinc-800"
          >
            Save changes
          </button>
        </div>
      </form>
    </div>
  );
}


import { notFound } from "next/navigation";
import { Plus } from "lucide-react";
import { db } from "@/db/client";
import { courses, lessons } from "@/db/schema";
import { asc, eq } from "drizzle-orm";
import { createLesson, updateCourse } from "../../../actions";
import { ThumbnailUploadField } from "@/components/ThumbnailUploadField";
import { EditableLessonList } from "./EditableLessonList";

export default async function EditCoursePage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId: courseIdParam } = await params;
  const id = Number(courseIdParam);
  if (Number.isNaN(id)) notFound();

  const [course] = await db
    .select()
    .from(courses)
    .where(eq(courses.id, id))
    .limit(1);
  if (!course) notFound();

  const courseLessons = await db
    .select()
    .from(lessons)
    .where(eq(lessons.courseId, id))
    .orderBy(asc(lessons.order));

  return (
    <div className="flex flex-col gap-8">
      <div className="rounded-xl border border-zinc-200 bg-white p-6">
        <h2 className="text-lg font-semibold tracking-tight">Edit course</h2>
        <form action={updateCourse} className="mt-4 grid gap-4 sm:grid-cols-2">
          <input type="hidden" name="id" value={course.id} />
          <label className="text-xs font-medium text-zinc-700 sm:col-span-2">
            Title
            <input
              type="text"
              name="title"
              defaultValue={course.title}
              required
              className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900"
            />
          </label>
          <label className="text-xs font-medium text-zinc-700 sm:col-span-2">
            Description
            <textarea
              name="description"
              defaultValue={course.description ?? ""}
              rows={3}
              className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900"
            />
          </label>
          <ThumbnailUploadField
            label={course.thumbnailUrl ? "Replace thumbnail" : "Thumbnail"}
            currentImageUrl={course.thumbnailUrl}
          />
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

      <div className="rounded-xl border border-zinc-200 bg-white p-6">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-lg font-semibold tracking-tight">Lessons</h2>
          <form action={createLesson}>
            <input type="hidden" name="courseId" value={id} />
            <input type="hidden" name="title" value="Untitled lesson" />
            <input type="hidden" name="content" value="" />
            <input
              type="hidden"
              name="order"
              value={courseLessons.length + 1}
            />
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded-full border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-100"
            >
              <Plus className="size-3.5" />
              Add lesson
            </button>
          </form>
        </div>
        <div className="mt-4 space-y-2">
          {courseLessons.length === 0 ? (
            <p className="text-sm text-zinc-500">
              No lessons yet. Click Add lesson above to create one.
            </p>
          ) : (
            <EditableLessonList
              lessons={courseLessons.map((l) => ({
                id: l.id,
                courseId: l.courseId,
                title: l.title,
                content: l.content,
                order: l.order,
                updatedAt: l.updatedAt,
              }))}
              courseId={id}
            />
          )}
          <p className="text-[11px] text-zinc-500">
            Add, remove, and reorder lessons. You can add content to each lesson
            in the expanded section below.
          </p>
        </div>
      </div>
    </div>
  );
}


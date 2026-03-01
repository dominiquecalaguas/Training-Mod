import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/db/client";
import { courses, lessons } from "@/db/schema";
import { asc, eq } from "drizzle-orm";
import { updateCourse } from "../../../actions";
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
        <h2 className="text-lg font-semibold tracking-tight">
          Lesson content
        </h2>
        {courseLessons.length === 0 ? (
          <p className="mt-4 text-sm text-zinc-500">
            No lessons yet.{" "}
            <Link
              href={`/admin/courses/${id}/lessons`}
              className="font-medium text-zinc-700 underline hover:text-zinc-900"
            >
              Add lessons from the Lessons page
            </Link>
            .
          </p>
        ) : (
          <div className="mt-4">
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
          </div>
        )}
      </div>
    </div>
  );
}


import { notFound } from "next/navigation";
import { courses, lessons } from "@/db/schema";
import { apiUrl } from "@/lib/api";
import { updateCourse } from "../../../actions";
import { ThumbnailUploadField } from "@/components/ThumbnailUploadField";
import { AddLessonButton } from "./AddLessonButton";
import { EditableLessonList } from "./EditableLessonList";

export default async function EditCoursePage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId: courseIdParam } = await params;
  const id = Number(courseIdParam);
  if (Number.isNaN(id)) notFound();

  const courseRes = await fetch(apiUrl(`/api/admin/courses/${id}`), {
    cache: "no-store",
  });
  if (!courseRes.ok || courseRes.status === 404) notFound();

  const course = (await courseRes.json()) as typeof courses.$inferSelect;

  const lessonsRes = await fetch(apiUrl(`/api/admin/courses/${id}/lessons`), {
    cache: "no-store",
  });
  if (!lessonsRes.ok) notFound();

  const courseLessons = (await lessonsRes.json()) as Array<
    typeof lessons.$inferSelect
  >;
  const lessonsKey = courseLessons.map((lesson) => lesson.id).join(",");

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
          <AddLessonButton courseId={id} nextOrder={courseLessons.length + 1} />
        </div>
        <div className="mt-4 space-y-2">
          {courseLessons.length === 0 ? (
            <p className="text-sm text-zinc-500">
              No lessons yet. Click Add lesson above to create one.
            </p>
          ) : (
            <EditableLessonList
              key={lessonsKey}
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

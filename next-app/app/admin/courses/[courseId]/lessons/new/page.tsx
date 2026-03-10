import { notFound } from "next/navigation";
import { courses, lessons } from "@/db/schema";
import { createLesson } from "../../../../actions";

export default async function NewLessonPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId: courseIdParam } = await params;
  const courseId = Number(courseIdParam);
  if (Number.isNaN(courseId)) notFound();

  const [courseRes, lessonsRes] = await Promise.all([
    fetch(`/api/admin/courses/${courseId}`, { cache: "no-store" }),
    fetch(`/api/admin/courses/${courseId}/lessons`, { cache: "no-store" }),
  ]);

  if (!courseRes.ok || courseRes.status === 404) notFound();
  if (!lessonsRes.ok) notFound();

  const course = (await courseRes.json()) as typeof courses.$inferSelect;
  const existing = (await lessonsRes.json()) as Array<
    typeof lessons.$inferSelect
  >;

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-6">
      <h2 className="text-lg font-semibold tracking-tight">
        New lesson for {course.title}
      </h2>
      <form action={createLesson} className="mt-4 grid gap-4 sm:grid-cols-2">
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
            rows={8}
            className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900"
          />
        </label>
        <label className="text-xs font-medium text-zinc-700">
          Order
          <input
            type="number"
            name="order"
            defaultValue={existing.length + 1}
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
    </div>
  );
}

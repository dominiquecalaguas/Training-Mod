import { notFound } from "next/navigation";
import { db } from "@/src/db/client";
import { courses } from "@/src/db/schema";
import { eq } from "drizzle-orm";
import { updateCourse } from "../../../actions";

export default async function EditCoursePage({
  params,
}: {
  params: { courseId: string };
}) {
  const id = Number(params.courseId);
  if (Number.isNaN(id)) notFound();

  const [course] = await db
    .select()
    .from(courses)
    .where(eq(courses.id, id))
    .limit(1);
  if (!course) notFound();

  return (
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
        <label className="text-xs font-medium text-zinc-700">
          Thumbnail URL
          <input
            type="url"
            name="thumbnailUrl"
            defaultValue={course.thumbnailUrl ?? ""}
            className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900"
          />
        </label>
        <label className="text-xs font-medium text-zinc-700">
          Order
          <input
            type="number"
            name="order"
            defaultValue={course.order}
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


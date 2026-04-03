import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { courses, lessons } from "@/db/schema";
import { apiUrl } from "@/lib/api";

export default async function CoursePage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId: courseIdParam } = await params;
  const courseId = Number(courseIdParam);
  if (Number.isNaN(courseId)) notFound();

  const cookieStore = await cookies();
  const headers = { Cookie: cookieStore.toString() };

  const [courseRes, lessonsRes] = await Promise.all([
    fetch(apiUrl(`/api/courses/${courseId}`), {
      cache: "no-store",
      headers,
    }),
    fetch(apiUrl(`/api/courses/${courseId}/lessons`), {
      cache: "no-store",
      headers,
    }),
  ]);

  if (!courseRes.ok || courseRes.status === 404 || courseRes.status === 403)
    notFound();
  if (!lessonsRes.ok || lessonsRes.status === 403) notFound();

  const course = (await courseRes.json()) as typeof courses.$inferSelect;
  const courseLessons = (await lessonsRes.json()) as Array<
    typeof lessons.$inferSelect
  >;

  if (courseLessons.length > 0) {
    redirect(`/courses/${courseId}/lessons/${courseLessons[0].id}`);
  }

  return (
    <main className="min-h-screen bg-neutral-50 py-10 px-4 text-neutral-900">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 lg:flex-row">
        <aside className="w-full rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm lg:w-72">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-neutral-500">
            Lessons
          </h2>
          <p className="text-sm text-neutral-600">
            This course has no lessons yet.
          </p>
        </aside>
        <section className="flex-1 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
            {course.title}
          </h1>
          {course.description && (
            <p className="mt-2 max-w-2xl text-sm text-neutral-600">
              {course.description}
            </p>
          )}
          <p className="mt-6 text-sm text-neutral-600">
            Lessons will appear here once they are added.
          </p>
        </section>
      </div>
    </main>
  );
}

import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/src/db/client";
import { courses, lessons } from "@/src/db/schema";
import { eq, asc } from "drizzle-orm";

export default async function CoursePage({
  params,
}: {
  params: { courseId: string };
}) {
  const courseId = Number(params.courseId);
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

  const firstLesson = courseLessons[0];

  return (
    <main className="min-h-screen bg-neutral-950 py-10 px-4 text-zinc-50">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 lg:flex-row">
        <aside className="w-full rounded-2xl border border-neutral-800 bg-neutral-900/80 p-4 lg:w-72">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-neutral-400">
            Lessons
          </h2>
          {courseLessons.length === 0 ? (
            <p className="text-sm text-neutral-400">
              This course has no lessons yet.
            </p>
          ) : (
            <ol className="space-y-1 text-sm">
              {courseLessons.map((lesson) => (
                <li key={lesson.id}>
                  <Link
                    href={`/courses/${course.id}/lessons/${lesson.id}`}
                    className="flex items-center gap-2 rounded-md px-2 py-1.5 text-neutral-300 hover:bg-neutral-800/80"
                  >
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-neutral-800 text-[11px] font-medium text-neutral-400">
                      {lesson.order}
                    </span>
                    <span className="line-clamp-1">{lesson.title}</span>
                  </Link>
                </li>
              ))}
            </ol>
          )}
        </aside>
        <section className="flex-1 rounded-2xl border border-neutral-800 bg-neutral-900/80 p-6">
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-50">
            {course.title}
          </h1>
          {course.description && (
            <p className="mt-2 max-w-2xl text-sm text-neutral-300">
              {course.description}
            </p>
          )}
          {firstLesson ? (
            <div className="mt-6">
              <p className="text-sm text-neutral-400">
                Start with the first lesson:
              </p>
              <Link
                href={`/courses/${course.id}/lessons/${firstLesson.id}`}
                className="mt-2 inline-flex items-center rounded-full bg-emerald-500 px-4 py-2 text-sm font-medium text-emerald-950 shadow-sm hover:bg-emerald-400"
              >
                {firstLesson.title}
              </Link>
            </div>
          ) : (
            <p className="mt-6 text-sm text-neutral-400">
              Lessons will appear here once they are added.
            </p>
          )}
        </section>
      </div>
    </main>
  );
}


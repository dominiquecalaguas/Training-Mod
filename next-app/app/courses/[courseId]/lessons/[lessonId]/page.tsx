import { notFound } from "next/navigation";
import { db } from "@/db/client";
import { courses, lessons } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { DeviceTokenProvider } from "@//components/DeviceTokenProvider";
import { CourseSidebar } from "@//components/CourseSidebar";
import { LessonContent } from "@//components/LessonContent";

export default async function LessonPage({
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

  const courseLessons = await db
    .select()
    .from(lessons)
    .where(eq(lessons.courseId, courseId))
    .orderBy(asc(lessons.order));

  const lesson = courseLessons.find((l) => l.id === lessonId);
  if (!lesson) notFound();

  return (
    <DeviceTokenProvider>
      <main className="min-h-screen bg-neutral-950 py-10 px-4 text-zinc-50">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 lg:flex-row">
          <CourseSidebar
            courseId={course.id}
            lessons={courseLessons}
            currentLessonId={lesson.id}
          />
          <section className="flex-1 rounded-2xl border border-neutral-800 bg-neutral-900/80 p-6">
            <LessonContent
              courseId={course.id}
              lessonId={lesson.id}
              title={lesson.title}
              content={lesson.content}
            />
          </section>
        </div>
      </main>
    </DeviceTokenProvider>
  );
}


import { notFound } from "next/navigation";
import { db } from "@/db/client";
import { courses, lessons } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { DeviceTokenProvider } from "@//components/DeviceTokenProvider";
import { LessonPageClient } from "./LessonPageClient";

export default async function LessonPage({
  params,
}: {
  params: Promise<{ courseId: string; lessonId: string }>;
}) {
  const { courseId: courseIdParam, lessonId: lessonIdParam } = await params;
  const courseId = Number(courseIdParam);
  const lessonId = Number(lessonIdParam);
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

  const currentIndex = courseLessons.findIndex((l) => l.id === lessonId);
  const nextLesson =
    currentIndex >= 0 && currentIndex < courseLessons.length - 1
      ? courseLessons[currentIndex + 1]
      : null;
  const nextLessonHref = nextLesson
    ? `/courses/${courseId}/lessons/${nextLesson.id}`
    : undefined;

  return (
    <DeviceTokenProvider>
      <LessonPageClient
        course={course}
        courseLessons={courseLessons}
        lesson={lesson}
        nextLessonHref={nextLessonHref}
      />
    </DeviceTokenProvider>
  );
}


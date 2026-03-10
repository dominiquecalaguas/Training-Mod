import { notFound } from "next/navigation";
import { courses, lessons } from "@/db/schema";
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

  const [courseRes, lessonsRes] = await Promise.all([
    fetch(`/api/courses/${courseId}`, { cache: "no-store" }),
    fetch(`/api/courses/${courseId}/lessons`, { cache: "no-store" }),
  ]);

  if (!courseRes.ok || courseRes.status === 404) notFound();
  if (!lessonsRes.ok) notFound();

  const course = (await courseRes.json()) as typeof courses.$inferSelect;
  const courseLessons = (await lessonsRes.json()) as Array<
    typeof lessons.$inferSelect
  >;

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

"use client";

import { useState } from "react";
import { CourseSidebar } from "@//components/CourseSidebar";
import { LessonContent } from "@//components/LessonContent";
import type { InferSelectModel } from "drizzle-orm";
import type { courses, lessons } from "@/db/schema";

type Course = InferSelectModel<typeof courses>;
type Lesson = InferSelectModel<typeof lessons>;

export function LessonPageClient({
  course,
  courseLessons,
  lesson,
  nextLessonHref,
}: {
  course: Course;
  courseLessons: Lesson[];
  lesson: Lesson;
  nextLessonHref: string | undefined;
}) {
  const [progressVersion, setProgressVersion] = useState(0);

  return (
    <main className="min-h-screen bg-neutral-50 py-10 px-4 text-neutral-900">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 lg:flex-row">
        <CourseSidebar
          courseId={course.id}
          courseTitle={course.title}
          lessons={courseLessons}
          currentLessonId={lesson.id}
          progressVersion={progressVersion}
        />
        <section className="flex-1 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          <LessonContent
            courseId={course.id}
            lessonId={lesson.id}
            title={lesson.title}
            content={lesson.content}
            nextLessonHref={nextLessonHref}
            onProgressChange={() => setProgressVersion((v) => v + 1)}
          />
        </section>
      </div>
    </main>
  );
}

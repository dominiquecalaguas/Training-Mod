"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { useSkyTransition } from "@/components/PrismaSkyTransition";
import { CourseSidebar } from "@//components/CourseSidebar";
import { LessonContent } from "@//components/LessonContent";
import { LessonViewTracker } from "@//components/LessonViewTracker";
import type { InferSelectModel } from "drizzle-orm";
import type { courses, lessons } from "@/db/schema";
import styles from "./morning-sky.module.css";

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
  const workspace = useRef<HTMLDivElement>(null);
  const transition = useSkyTransition();
  const startedAt = transition?.startedAt ?? null;
  const skip = startedAt === null ? undefined : transition?.finish;

  useLayoutEffect(() => {
    if (startedAt !== null) {
      const delay = 850 - (performance.now() - startedAt);
      workspace.current?.style.setProperty("--prisma-arrival-delay", `${delay}ms`);
    }
  }, [startedAt]);

  return (
    <main
      className={`min-h-screen px-4 py-10 text-neutral-900 ${styles.reader} ${styles.morningSurface}`}
      onFocusCapture={skip}
      onPointerDownCapture={skip}
    >
      <div className={styles.clouds} aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <LessonViewTracker courseId={course.id} lessonId={lesson.id} />
      <div ref={workspace} className={`${styles.workspace} ${startedAt !== null ? styles.arriving : ""}`}>
        <CourseSidebar
          courseId={course.id}
          courseTitle={course.title}
          lessons={courseLessons}
          currentLessonId={lesson.id}
          progressVersion={progressVersion}
        />
        <section className={`min-w-0 rounded-[20px] border border-neutral-200/90 bg-white p-6 shadow-[0_0_15px_rgba(174,194,255,0.45)] ${styles.reading}`}>
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

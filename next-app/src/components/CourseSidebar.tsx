"use client";

import Link from "next/link";
import { useEffect, useId, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { InferSelectModel } from "drizzle-orm";
import { lessons } from "@/db/schema";
import { useDeviceToken } from "@//components/DeviceTokenProvider";
import { trackLessonClicked } from "@/lib/analytics";
import styles from "./course-outline.module.css";

type Lesson = InferSelectModel<typeof lessons>;

type LessonProgressMap = Record<number, boolean>;

type CourseProgressMap = Record<
  number,
  { totalLessons: number; completedLessons: number }
>;

export function CourseSidebar({
  courseId,
  courseTitle,
  lessons: courseLessons,
  currentLessonId,
  progressVersion = 0,
}: {
  courseId: number;
  courseTitle: string;
  lessons: Lesson[];
  currentLessonId?: number;
  /** Increment to force refetch of lesson progress (e.g. after complete/uncomplete). */
  progressVersion?: number;
}) {
  const deviceToken = useDeviceToken();
  const listId = useId();
  const [outlineExpanded, setOutlineExpanded] = useState(false);
  const [lessonProgress, setLessonProgress] = useState<LessonProgressMap>({});
  const [courseProgress, setCourseProgress] = useState<CourseProgressMap>({});

  useEffect(() => {
    let cancelled = false;
    async function loadLessons() {
      const res = await fetch(
        `/api/progress/lessons?deviceToken=${encodeURIComponent(
          deviceToken,
        )}&courseId=${courseId}`,
      );
      if (!res.ok) return;
      const data = (await res.json()) as LessonProgressMap;
      if (!cancelled) setLessonProgress(data);
    }
    loadLessons();
    return () => {
      cancelled = true;
    };
  }, [courseId, deviceToken, progressVersion]);

  useEffect(() => {
    let cancelled = false;
    async function loadCourses() {
      const res = await fetch(
        `/api/progress/courses?deviceToken=${encodeURIComponent(deviceToken)}`,
      );
      if (!res.ok) return;
      const data = (await res.json()) as CourseProgressMap;
      if (!cancelled) setCourseProgress(data);
    }
    loadCourses();
    return () => {
      cancelled = true;
    };
  }, [deviceToken, progressVersion]);

  const stats = courseProgress[courseId];
  const totalLessons = stats?.totalLessons ?? courseLessons.length;
  const completedLessons = stats?.completedLessons ?? 0;
  return (
    <aside className={`w-full rounded-[20px] p-4 ${styles.outline}`}>
      <h2 className="mb-1 text-sm font-semibold tracking-tight text-neutral-900 line-clamp-2">
        {courseTitle}
      </h2>
      {courseLessons.length > 0 && (
        <p className="mb-5 text-xs text-neutral-600">
          {completedLessons} out of {totalLessons} lessons completed
        </p>
      )}
      <button
        type="button"
        className="flex min-h-11 w-full items-center justify-between gap-3 rounded-md px-2.5 text-left text-sm font-semibold text-neutral-800 hover:bg-[#E7EDFF]/75 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#48608f] lg:hidden"
        aria-expanded={outlineExpanded}
        aria-controls={listId}
        onClick={() => setOutlineExpanded((expanded) => !expanded)}
      >
        Lessons
        <ChevronDown
          className={outlineExpanded ? "size-4 rotate-180" : "size-4"}
          aria-hidden="true"
        />
      </button>
      <h3 className="mb-3.5 hidden text-xs font-semibold uppercase tracking-wide text-neutral-500 lg:block">
        Lessons
      </h3>
      <div id={listId} className={outlineExpanded ? "mt-2 lg:mt-0" : "hidden lg:block"}>
        {courseLessons.length === 0 ? (
          <p className="text-sm text-neutral-600">
            This course has no lessons yet.
          </p>
        ) : (
          <ol className="space-y-1 text-sm">
            {courseLessons.map((lesson) => {
              const isCurrent = lesson.id === currentLessonId;
              const isDone = lessonProgress[lesson.id];
              return (
                <li key={lesson.id}>
                  <Link
                    href={`/courses/${courseId}/lessons/${lesson.id}`}
                    onClick={() => trackLessonClicked(courseId, lesson.id)}
                    title={lesson.title}
                    aria-label={isDone ? `${lesson.title}, completed` : undefined}
                    aria-current={isCurrent ? "page" : undefined}
                    className={`flex h-auto min-h-11 items-center gap-2.5 rounded-md px-2.5 py-2.5 text-neutral-700 hover:bg-[#E7EDFF]/75 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#48608f] ${
                      isCurrent
                        ? "bg-[#E7EDFF]/75 font-medium text-neutral-900"
                        : ""
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className={`inline-flex size-[22px] shrink-0 items-center justify-center rounded-full ${
                        isDone
                          ? styles.completed
                          : "border-2 border-neutral-300 bg-transparent"
                      }`}
                    >
                      {isDone ? (
                        <Check className="size-3.5" strokeWidth={2.5} />
                      ) : null}
                    </span>
                    <span className="min-w-0 flex-1 whitespace-normal [overflow-wrap:break-word]">{lesson.title}</span>
                  </Link>
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </aside>
  );
}


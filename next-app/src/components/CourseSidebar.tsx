"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { InferSelectModel } from "drizzle-orm";
import { lessons } from "@/db/schema";
import { useDeviceToken } from "@//components/DeviceTokenProvider";

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
}: {
  courseId: number;
  courseTitle: string;
  lessons: Lesson[];
  currentLessonId?: number;
}) {
  const deviceToken = useDeviceToken();
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
  }, [courseId, deviceToken]);

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
  }, [deviceToken]);

  const stats = courseProgress[courseId];
  const totalLessons = stats?.totalLessons ?? courseLessons.length;
  const completedLessons = stats?.completedLessons ?? 0;
  const pct =
    totalLessons > 0
      ? Math.round((completedLessons / totalLessons) * 100)
      : 0;

  return (
    <aside className="w-full rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm lg:w-72">
      <h2 className="mb-2 text-sm font-semibold tracking-tight text-neutral-900 line-clamp-2">
        {courseTitle}
      </h2>
      {courseLessons.length > 0 && (
        <div className="mb-4">
          <div className="flex h-2 w-full overflow-hidden rounded-full bg-neutral-200">
            <div
              className="bg-emerald-500 transition-all duration-300"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="mt-1.5 text-xs font-medium text-neutral-500">
            {pct}% complete
          </p>
        </div>
      )}
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-neutral-500">
        Lessons
      </h3>
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
                  className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-neutral-700 hover:bg-neutral-100 ${
                    isCurrent
                      ? "bg-amber-100 font-medium text-amber-900"
                      : ""
                  }`}
                >
                  <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-neutral-200 text-[11px] font-medium text-neutral-600">
                    {lesson.order}
                  </span>
                  <span className="flex-1 truncate">{lesson.title}</span>
                  {isDone && (
                    <span className="shrink-0 text-xs text-emerald-600">✓</span>
                  )}
                </Link>
              </li>
            );
          })}
        </ol>
      )}
    </aside>
  );
}


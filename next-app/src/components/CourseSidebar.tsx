"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { InferSelectModel } from "drizzle-orm";
import { lessons } from "@/db/schema";
import { useDeviceToken } from "@//components/DeviceTokenProvider";

type Lesson = InferSelectModel<typeof lessons>;

type LessonProgressMap = Record<number, boolean>;

export function CourseSidebar({
  courseId,
  lessons: courseLessons,
  currentLessonId,
}: {
  courseId: number;
  lessons: Lesson[];
  currentLessonId?: number;
}) {
  const deviceToken = useDeviceToken();
  const [progress, setProgress] = useState<LessonProgressMap>({});

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const res = await fetch(
        `/api/progress/lessons?deviceToken=${encodeURIComponent(
          deviceToken,
        )}&courseId=${courseId}`,
      );
      if (!res.ok) return;
      const data = (await res.json()) as LessonProgressMap;
      if (!cancelled) setProgress(data);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [courseId, deviceToken]);

  return (
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
          {courseLessons.map((lesson) => {
            const isCurrent = lesson.id === currentLessonId;
            const isDone = progress[lesson.id];
            return (
              <li key={lesson.id}>
                <Link
                  href={`/courses/${courseId}/lessons/${lesson.id}`}
                  className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-neutral-300 hover:bg-neutral-800/80 ${
                    isCurrent ? "bg-neutral-800 font-medium text-white" : ""
                  }`}
                >
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-neutral-800 text-[11px] font-medium text-neutral-400">
                    {lesson.order}
                  </span>
                  <span className="flex-1 truncate">{lesson.title}</span>
                  {isDone && (
                    <span className="text-xs text-emerald-400">✓</span>
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


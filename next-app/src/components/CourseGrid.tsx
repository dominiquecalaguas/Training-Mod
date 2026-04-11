"use client";

import { useEffect, useState } from "react";
import { CourseCard } from "@/components/CourseCard";
import { useDeviceToken } from "@/components/DeviceTokenProvider";
import type { CourseWithLessonsForSearch } from "@/lib/courses";
import type { CourseSearchResult } from "@/lib/search-courses";

type ProgressMap = Record<
  number,
  { totalLessons: number; completedLessons: number }
>;

export function CourseGrid({
  courses,
  lessonCountByCourseId = {},
  searchResults,
  searchKeywords,
}: {
  courses: CourseWithLessonsForSearch[];
  lessonCountByCourseId?: Record<number, number>;
  /** When set (active search), drives order and matched-lesson rows on cards. */
  searchResults?: CourseSearchResult[];
  searchKeywords?: readonly string[];
}) {
  const deviceToken = useDeviceToken();
  const [progress, setProgress] = useState<ProgressMap>({});

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch(
          `/api/progress/courses?deviceToken=${encodeURIComponent(deviceToken)}`,
        );
        if (!res.ok) return;
        const data = (await res.json()) as ProgressMap;
        if (!cancelled) setProgress(data);
      } catch {
        // Network/offline or non-JSON response — keep empty progress; cards still render.
        if (!cancelled) setProgress({});
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [deviceToken]);

  if (courses.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-neutral-300 bg-white p-8 text-sm text-neutral-600 shadow-sm">
        <h2 className="text-base font-medium text-neutral-900">
          No courses yet
        </h2>
        <p className="mt-2 max-w-md text-sm text-neutral-600">
          Your classroom is ready. Visit the{" "}
          <span className="font-medium text-neutral-900">Admin</span> area to
          create your first course and it will appear here.
        </p>
      </div>
    );
  }

  const rows: CourseSearchResult[] =
    searchResults ??
    courses.map((c) => ({
      course: c,
      matchedLessons: [],
    }));

  return (
    <section>
      <div className="grid grid-cols-1 gap-x-[35px] gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
        {rows.map(({ course, matchedLessons }) => {
          const stats = progress[course.id];
          const totalLessons =
            lessonCountByCourseId[course.id] ?? stats?.totalLessons ?? 0;
          const completedLessons = stats?.completedLessons ?? 0;

          return (
            <CourseCard
              key={course.id}
              course={course}
              totalLessons={totalLessons}
              completedLessons={completedLessons}
              matchedLessons={
                searchResults && matchedLessons.length > 0
                  ? matchedLessons
                  : undefined
              }
              searchKeywords={searchResults ? searchKeywords : undefined}
            />
          );
        })}
      </div>
    </section>
  );
}

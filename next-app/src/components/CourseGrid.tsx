"use client";

import { useEffect, useState } from "react";
import styles from "./course-library.module.css";
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
      <div className={styles.empty}>
        <h3>No courses yet</h3>
        <p>Courses will appear here when they’re published.</p>
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
    <div className={styles.grid}>
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
  );
}

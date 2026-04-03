"use client";

import { useEffect, useState } from "react";
import { CourseCard } from "@/components/CourseCard";
import { useDeviceToken } from "@//components/DeviceTokenProvider";
import type { CourseListItem } from "@/lib/courses";

type ProgressMap = Record<
  number,
  { totalLessons: number; completedLessons: number }
>;

export function CourseGrid({
  courses,
  lessonCountByCourseId = {},
}: {
  courses: CourseListItem[];
  lessonCountByCourseId?: Record<number, number>;
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

  return (
    <section>
      <div className="grid grid-cols-1 gap-x-[35px] gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
        {courses.map((course) => {
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
            />
          );
        })}
      </div>
    </section>
  );
}

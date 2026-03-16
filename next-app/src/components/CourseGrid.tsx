"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useDeviceToken } from "@//components/DeviceTokenProvider";
import { trackCourseClicked } from "@/lib/analytics";
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
      const res = await fetch(
        `/api/progress/courses?deviceToken=${encodeURIComponent(deviceToken)}`,
      );
      if (!res.ok) return;
      const data = (await res.json()) as ProgressMap;
      if (!cancelled) setProgress(data);
    }
    load();
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
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {courses.map((course) => {
          const stats = progress[course.id];
          const totalLessons =
            lessonCountByCourseId[course.id] ?? stats?.totalLessons ?? 0;
          const completedLessons = stats?.completedLessons ?? 0;
          const pct =
            totalLessons > 0
              ? Math.round((completedLessons / totalLessons) * 100)
              : 0;

          return (
            <Link
              key={course.id}
              href={`/courses/${course.id}`}
              onClick={() => trackCourseClicked(course.id)}
              className="group flex flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-md transition hover:-translate-y-0.5 hover:border-neutral-300 hover:shadow-lg"
            >
              {course.thumbnailUrl ? (
                <div className="relative h-40 w-full overflow-hidden bg-neutral-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={course.thumbnailUrl}
                    alt={course.title}
                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                  />
                </div>
              ) : (
                <div className="flex h-40 items-center justify-center bg-neutral-100 text-xs font-medium uppercase tracking-wide text-neutral-500">
                  No thumbnail yet
                </div>
              )}
              <div className="flex flex-1 flex-col gap-3 p-4">
                <div className="flex items-start justify-between gap-2">
                  <h2 className="line-clamp-2 text-sm font-semibold text-neutral-900">
                    {course.title}
                  </h2>
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700 ring-1 ring-emerald-200">
                    {pct === 0 ? "Not started" : `${pct}% done`}
                  </span>
                </div>
                {course.description && (
                  <p className="line-clamp-3 text-xs text-neutral-600">
                    {course.description}
                  </p>
                )}
                {totalLessons > 0 && (
                  <div className="mt-auto space-y-1.5">
                    <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-200">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-emerald-500 to-emerald-600 transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <p className="text-[11px] text-neutral-500">
                      {completedLessons} out of {totalLessons} lessons completed
                    </p>
                  </div>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}


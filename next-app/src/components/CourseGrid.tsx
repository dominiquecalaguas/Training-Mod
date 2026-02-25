"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { InferSelectModel } from "drizzle-orm";
import { courses } from "@/src/db/schema";
import { useDeviceToken } from "@/src/components/DeviceTokenProvider";

type Course = InferSelectModel<typeof courses>;

type ProgressMap = Record<
  number,
  { totalLessons: number; completedLessons: number }
>;

export function CourseGrid({ courses }: { courses: Course[] }) {
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
      <div className="rounded-2xl border border-dashed border-neutral-800 bg-neutral-900/60 p-8 text-sm text-neutral-300">
        <h2 className="text-base font-medium text-neutral-100">
          No courses yet
        </h2>
        <p className="mt-2 max-w-md text-sm text-neutral-400">
          Your classroom is ready. Visit the{" "}
          <span className="font-medium text-neutral-100">Admin</span> area to
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
          const pct =
            stats && stats.totalLessons > 0
              ? Math.round(
                  (stats.completedLessons / stats.totalLessons) * 100,
                )
              : 0;

          return (
            <Link
              key={course.id}
              href={`/courses/${course.id}`}
              className="group flex flex-col overflow-hidden rounded-2xl border border-neutral-800 bg-gradient-to-b from-neutral-900/90 to-neutral-950 shadow-[0_18px_40px_rgba(0,0,0,0.65)] transition hover:-translate-y-1 hover:border-neutral-500/70 hover:shadow-[0_22px_55px_rgba(0,0,0,0.85)]"
            >
              {course.thumbnailUrl ? (
                <div className="relative h-40 w-full overflow-hidden bg-neutral-900">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={course.thumbnailUrl}
                    alt={course.title}
                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                  />
                </div>
              ) : (
                <div className="flex h-40 items-center justify-center bg-neutral-900 text-xs font-medium uppercase tracking-wide text-neutral-500">
                  No thumbnail yet
                </div>
              )}
              <div className="flex flex-1 flex-col gap-3 p-4">
                <div className="flex items-start justify-between gap-2">
                  <h2 className="line-clamp-2 text-sm font-semibold text-neutral-50">
                    {course.title}
                  </h2>
                  <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-300 ring-1 ring-emerald-500/40">
                    {pct === 0 ? "Not started" : `${pct}% done`}
                  </span>
                </div>
                {course.description && (
                  <p className="line-clamp-3 text-xs text-neutral-300">
                    {course.description}
                  </p>
                )}
                <div className="mt-auto">
                  <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-800">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-emerald-300 to-emerald-500 transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  {stats && (
                    <p className="mt-1 text-[11px] text-neutral-400">
                      {stats.completedLessons}/{stats.totalLessons} lessons
                      completed
                    </p>
                  )}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}


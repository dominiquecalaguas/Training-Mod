"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { InferSelectModel } from "drizzle-orm";
import { courses, lessons } from "@/db/schema";
import { useDeviceToken } from "@//components/DeviceTokenProvider";
import { trackCourseClicked, trackLessonClicked } from "@/lib/analytics";

type Course = InferSelectModel<typeof courses>;
type Lesson = InferSelectModel<typeof lessons>;

type ProgressMap = Record<
  number,
  { totalLessons: number; completedLessons: number }
>;

export function CourseLibrary({
  courses: courseList,
  lessonsByCourseId,
}: {
  courses: Course[];
  lessonsByCourseId: Record<number, Lesson[]>;
}) {
  const deviceToken = useDeviceToken();
  const [progress, setProgress] = useState<ProgressMap>({});
  const [expandedId, setExpandedId] = useState<number | null>(null);

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

  if (courseList.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-neutral-800 bg-neutral-900/60 p-8 text-sm text-neutral-300">
        <h2 className="text-base font-medium text-neutral-100">
          No courses yet
        </h2>
        <p className="mt-2 max-w-md text-sm text-neutral-400">
          The course library is empty. Visit the{" "}
          <span className="font-medium text-neutral-100">Admin</span> area to
          create your first course and it will appear here.
        </p>
      </div>
    );
  }

  return (
    <section className="space-y-4">
      {courseList.map((course) => {
        const courseLessons = lessonsByCourseId[course.id] ?? [];
        const stats = progress[course.id];
        const totalLessons = courseLessons.length;
        const pct =
          stats && totalLessons > 0
            ? Math.round((stats.completedLessons / totalLessons) * 100)
            : 0;
        const isExpanded = expandedId === course.id;

        return (
          <div
            key={course.id}
            className="overflow-hidden rounded-2xl border border-neutral-800 bg-gradient-to-b from-neutral-900/90 to-neutral-950 shadow-[0_18px_40px_rgba(0,0,0,0.65)]"
          >
            <div className="flex flex-col sm:flex-row sm:items-stretch">
              <Link
                href={`/courses/${course.id}`}
                onClick={() => trackCourseClicked(course.id)}
                className="group flex flex-1 flex-col overflow-hidden sm:min-w-0"
              >
                {course.thumbnailUrl ? (
                  <div className="relative h-32 w-full overflow-hidden bg-neutral-900 sm:h-28 sm:w-40 sm:shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={course.thumbnailUrl}
                      alt=""
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    />
                  </div>
                ) : (
                  <div className="flex h-32 shrink-0 items-center justify-center bg-neutral-900 text-xs font-medium uppercase tracking-wide text-neutral-500 sm:h-28 sm:w-40">
                    No thumbnail
                  </div>
                )}
                <div className="flex flex-1 flex-col gap-2 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <h2 className="text-base font-semibold text-neutral-50 sm:line-clamp-2">
                      {course.title}
                    </h2>
                    <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-300 ring-1 ring-emerald-500/40">
                      {pct === 0 ? "Not started" : `${pct}%`}
                    </span>
                  </div>
                  {course.description && (
                    <p className="line-clamp-2 text-sm text-neutral-400">
                      {course.description}
                    </p>
                  )}
                  <div className="mt-auto flex items-center gap-3">
                    <span className="text-xs text-neutral-500">
                      {totalLessons} lesson{totalLessons !== 1 ? "s" : ""}
                    </span>
                    <div className="h-1.5 flex-1 max-w-[120px] overflow-hidden rounded-full bg-neutral-800">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-500 transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </div>
              </Link>
              <div className="flex border-t border-neutral-800 sm:border-t-0 sm:border-l sm:flex-col sm:justify-center">
                <button
                  type="button"
                  onClick={() =>
                    setExpandedId((id) => (id === course.id ? null : course.id))
                  }
                  className="flex flex-1 items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-neutral-300 transition hover:bg-neutral-800/80 hover:text-white sm:flex-initial sm:px-5"
                  aria-expanded={isExpanded}
                  aria-controls={`course-lessons-${course.id}`}
                >
                  {isExpanded ? "Hide lessons" : "View lessons"}
                </button>
              </div>
            </div>
            <div
              id={`course-lessons-${course.id}`}
              role="region"
              aria-label={`Lessons for ${course.title}`}
              className={
                isExpanded
                  ? "border-t border-neutral-800 bg-neutral-900/60"
                  : "hidden"
              }
            >
              {courseLessons.length === 0 ? (
                <p className="p-4 text-sm text-neutral-500">
                  No lessons yet.
                </p>
              ) : (
                <ol className="list-none p-2">
                  {courseLessons.map((lesson) => (
                    <li key={lesson.id}>
                      <Link
                        href={`/courses/${course.id}/lessons/${lesson.id}`}
                        onClick={() =>
                          trackLessonClicked(course.id, lesson.id)
                        }
                        className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-neutral-300 transition hover:bg-neutral-800/80 hover:text-white"
                      >
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-neutral-800 text-xs font-medium text-neutral-400">
                          {lesson.order}
                        </span>
                        <span className="truncate">{lesson.title}</span>
                      </Link>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </div>
        );
      })}
    </section>
  );
}

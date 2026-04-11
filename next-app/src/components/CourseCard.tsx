"use client";

import Link from "next/link";
import { trackCourseClicked } from "@/lib/analytics";
import { KeywordHighlight } from "@/components/KeywordHighlight";
import type { CourseListItem } from "@/lib/courses";
import type { MatchedLessonResult } from "@/lib/search-courses";

const MATCHED_LESSON_PREVIEW = 3;

function statusBadge({
  pct,
  totalLessons,
}: {
  pct: number;
  totalLessons: number;
}) {
  if (totalLessons === 0) {
    return (
      <span className="shrink-0 rounded-full bg-[#E8EDFE] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-[#2A5CF2]">
        No lessons
      </span>
    );
  }
  if (pct === 0) {
    return (
      <span className="shrink-0 rounded-full bg-[#E8EDFE] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-[#2A5CF2]">
        Not yet started
      </span>
    );
  }
  if (pct === 100) {
    return (
      <span className="shrink-0 rounded-full bg-[#4468D2] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-white">
        100% done
      </span>
    );
  }
  return (
    <span className="shrink-0 rounded-full bg-[#E8EDFE] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-[#2A5CF2]">
      {pct}% done
    </span>
  );
}

export function CourseCard({
  course,
  totalLessons,
  completedLessons,
  matchedLessons,
  searchKeywords,
}: {
  course: CourseListItem;
  totalLessons: number;
  completedLessons: number;
  matchedLessons?: MatchedLessonResult[];
  /** When empty, snippets render without highlights. */
  searchKeywords?: readonly string[];
}) {
  const pct =
    totalLessons > 0
      ? Math.round((completedLessons / totalLessons) * 100)
      : 0;
  const showMastery =
    totalLessons > 0 && completedLessons >= totalLessons;

  const showHighlight =
    Array.isArray(searchKeywords) && searchKeywords.length > 0;
  const kw = searchKeywords ?? [];

  return (
    <Link
      href={`/courses/${course.id}`}
      onClick={() => trackCourseClicked(course.id)}
      className="group flex flex-col overflow-visible rounded-[20px] border border-neutral-200/90 bg-white shadow-[0_0_15px_rgba(174,194,255,0.45)] transition hover:-translate-y-0.5 hover:border-neutral-300 hover:shadow-[0_0_15px_rgba(174,194,255,0.5)]"
    >
      <div className="relative w-full">
        <div className="relative aspect-[388/160] w-full overflow-hidden rounded-t-[20px] bg-neutral-100">
          {course.thumbnailUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={course.thumbnailUrl}
              alt={course.title}
              className="h-full w-full object-cover transition-transform group-hover:scale-[1.02]"
            />
          ) : (
            <div className="flex h-full min-h-[8rem] items-center justify-center text-xs font-medium uppercase tracking-wide text-neutral-500">
              No thumbnail yet
            </div>
          )}
          {showMastery && (
            <div className="pointer-events-none absolute right-3 top-3 z-10">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/course-card/star-fall-mastery.svg"
                alt=""
                width={51}
                height={52}
                className="h-11 w-auto"
              />
            </div>
          )}
        </div>
        <div className="pointer-events-none absolute left-[5%] top-0 z-20 flex h-1/2 max-h-[50%] w-[16.666%] min-w-[42px] max-w-[72px] -translate-y-[12%] items-start">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/course-card/rectangle-8.svg"
            alt=""
            width={42}
            height={76}
            className="h-full max-w-full w-auto object-contain object-left"
          />
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 overflow-hidden rounded-b-[20px] bg-white p-4 pt-4">
        <div className="flex items-start justify-between gap-3">
          <h2 className="line-clamp-2 min-w-0 flex-1 text-base font-semibold leading-snug text-neutral-900">
            {showHighlight ? (
              <KeywordHighlight
                text={course.title}
                keywords={kw}
                variant="yellow"
                className="text-neutral-900"
              />
            ) : (
              course.title
            )}
          </h2>
          {statusBadge({ pct, totalLessons })}
        </div>

        {course.description && (
          <p className="line-clamp-2 text-sm leading-relaxed text-neutral-800">
            {showHighlight ? (
              <KeywordHighlight
                text={course.description}
                keywords={kw}
                variant="yellow"
                className="text-neutral-800"
              />
            ) : (
              course.description
            )}
          </p>
        )}

        {matchedLessons && matchedLessons.length > 0 && (
          <div className="mt-1 space-y-2.5 border-t border-neutral-100 pt-3">
            {matchedLessons.slice(0, MATCHED_LESSON_PREVIEW).map(({ lesson, snippet }) => (
              <div key={lesson.id}>
                <p className="text-[11px] font-medium uppercase tracking-wide text-neutral-500">
                  Lesson {lesson.order}
                </p>
                <p className="mt-0.5 text-xs font-medium leading-snug text-neutral-900">
                  {showHighlight ? (
                    <KeywordHighlight
                      text={lesson.title}
                      keywords={kw}
                      variant="yellow"
                      className="text-neutral-900"
                    />
                  ) : (
                    lesson.title
                  )}
                </p>
                {snippet.trim() ? (
                  <p className="mt-1 text-xs leading-relaxed">
                    <KeywordHighlight
                      text={snippet}
                      keywords={kw}
                      variant="yellow"
                      className="text-neutral-500"
                    />
                  </p>
                ) : null}
              </div>
            ))}
            {matchedLessons.length > MATCHED_LESSON_PREVIEW && (
              <p className="text-xs text-neutral-500">
                and {matchedLessons.length - MATCHED_LESSON_PREVIEW} more
                {matchedLessons.length - MATCHED_LESSON_PREVIEW === 1
                  ? " lesson"
                  : " lessons"}
              </p>
            )}
          </div>
        )}

        {totalLessons > 0 && (
          <div className="mt-auto space-y-2">
            <div className="relative">
              <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-[#E8EDFE]">
                <div
                  className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-[#AEC2FF] to-[#4468D2] transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <div
                className="pointer-events-none absolute -top-3 h-4 w-2 -translate-x-1/2 rounded-full border border-[#7699FF] bg-[#CFDBFD] shadow-sm"
                style={{ left: `${pct}%` }}
                aria-hidden
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
}

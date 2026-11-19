"use client";

import Link from "next/link";
import { BookOpen } from "lucide-react";
import styles from "./course-library.module.css";
import { trackCourseClicked } from "@/lib/analytics";
import { KeywordHighlight } from "@/components/KeywordHighlight";
import type { CourseListItem } from "@/lib/courses";
import type { MatchedLessonResult } from "@/lib/search-courses";

const MATCHED_LESSON_PREVIEW = 3;

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
  const showMastery = totalLessons > 0 && completedLessons >= totalLessons;
  const status = totalLessons === 0
    ? "No lessons"
    : pct === 0 ? "Not started" : `${pct}% done`;

  const showHighlight =
    Array.isArray(searchKeywords) && searchKeywords.length > 0;
  const kw = searchKeywords ?? [];

  return (
    <Link
      href={`/courses/${course.id}`}
      onClick={() => trackCourseClicked(course.id)}
      className={styles.card}
    >
      <div className={styles.cover}>
        {course.thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={course.thumbnailUrl}
            alt={course.title}
            className={styles.thumbnail}
            loading="lazy"
          />
        ) : (
          <BookOpen size={34} strokeWidth={1.25} className={styles.coverPlaceholder} aria-hidden="true" />
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

      <div className={styles.cardBody}>
        <div className={styles.cardHeader}>
          <h3 className={styles.cardTitle}>
            {showHighlight ? (
              <KeywordHighlight
                text={course.title}
                keywords={kw}
                variant="yellow"
              />
            ) : (
              course.title
            )}
          </h3>
          <span className={styles.status} data-complete={showMastery}>{status}</span>
        </div>

        {course.description && (
          <p className={styles.description}>
            {showHighlight ? (
              <KeywordHighlight
                text={course.description}
                keywords={kw}
                variant="yellow"
              />
            ) : (
              course.description
            )}
          </p>
        )}

        {matchedLessons && matchedLessons.length > 0 && (
          <div className={styles.matches}>
            {matchedLessons.slice(0, MATCHED_LESSON_PREVIEW).map(({ lesson, snippet }) => (
              <div key={lesson.id}>
                <p className={styles.matchLabel}>
                  Lesson {lesson.order}
                </p>
                <p className={styles.matchTitle}>
                  {showHighlight ? (
                    <KeywordHighlight
                      text={lesson.title}
                      keywords={kw}
                      variant="yellow"
                    />
                  ) : (
                    lesson.title
                  )}
                </p>
                {snippet.trim() ? (
                  <p className={styles.matchSnippet}>
                    <KeywordHighlight
                      text={snippet}
                      keywords={kw}
                      variant="yellow"
                    />
                  </p>
                ) : null}
              </div>
            ))}
            {matchedLessons.length > MATCHED_LESSON_PREVIEW && (
              <p className={styles.matchSnippet}>
                and {matchedLessons.length - MATCHED_LESSON_PREVIEW} more
                {matchedLessons.length - MATCHED_LESSON_PREVIEW === 1
                  ? " lesson"
                  : " lessons"}
              </p>
            )}
          </div>
        )}

        {totalLessons > 0 && (
          <div className={styles.cardProgress}>
            <progress
              value={Math.min(completedLessons, totalLessons)}
              max={totalLessons}
              aria-label={`Progress for ${course.title}`}
            />
            <p>{completedLessons} out of {totalLessons} lessons completed</p>
          </div>
        )}
      </div>
    </Link>
  );
}

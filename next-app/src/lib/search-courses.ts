import type {
  CourseLessonForSearch,
  CourseListItem,
  CourseWithLessonsForSearch,
} from "@/lib/courses";

const SEARCH_STOP_WORDS = new Set([
  "a",
  "an",
  "the",
  "and",
  "or",
  "in",
  "of",
  "to",
  "for",
  "is",
  "with",
  "on",
  "at",
  "it",
  "this",
  "that",
  "be",
  "as",
  "are",
  "was",
]);

export type MatchedLessonResult = {
  lesson: CourseLessonForSearch;
  snippet: string;
};

export type CourseSearchResult = {
  course: CourseWithLessonsForSearch;
  matchedLessons: MatchedLessonResult[];
};

function normalizeQueryWords(query: string): string[] {
  return query
    .toLowerCase()
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0 && !SEARCH_STOP_WORDS.has(w));
}

/** Keywords used for search and UI highlighting (same rules as search). */
export function getSearchKeywords(query: string): string[] {
  return normalizeQueryWords(query);
}

function safeLessonSearchText(lesson: CourseLessonForSearch): string {
  return lesson.searchText ?? "";
}

function matchesCourseTitleOnly(course: CourseListItem, kw: string): boolean {
  return course.title.toLowerCase().includes(kw);
}

function matchesCourseLevel(course: CourseListItem, kw: string): boolean {
  if (matchesCourseTitleOnly(course, kw)) return true;
  const d = course.description;
  return d != null && d.toLowerCase().includes(kw);
}

function matchesLessonTitle(
  lessons: readonly CourseLessonForSearch[],
  kw: string,
): boolean {
  return lessons.some((l) => l.title.toLowerCase().includes(kw));
}

function matchesLessonContent(
  lessons: readonly CourseLessonForSearch[],
  kw: string,
): boolean {
  return lessons.some((l) =>
    safeLessonSearchText(l).toLowerCase().includes(kw),
  );
}

function keywordMatchesCourseSomewhere(
  course: CourseListItem,
  lessons: readonly CourseLessonForSearch[],
  kw: string,
): boolean {
  return (
    matchesCourseLevel(course, kw) ||
    matchesLessonTitle(lessons, kw) ||
    matchesLessonContent(lessons, kw)
  );
}

function rankForCourse(
  course: CourseListItem,
  lessons: readonly CourseLessonForSearch[],
  keywords: readonly string[],
): 1 | 2 | 3 {
  if (keywords.every((kw) => matchesCourseTitleOnly(course, kw))) return 1;
  if (
    keywords.every(
      (kw) =>
        matchesCourseLevel(course, kw) || matchesLessonTitle(lessons, kw),
    )
  ) {
    return 2;
  }
  return 3;
}

/** First index of any keyword in text (lowercase), or -1. */
function firstKeywordIndexInText(
  text: string,
  keywords: readonly string[],
): { index: number; keyword: string } | null {
  const lower = text.toLowerCase();
  let best: { index: number; keyword: string } | null = null;
  for (const kw of keywords) {
    const i = lower.indexOf(kw);
    if (i !== -1 && (best === null || i < best.index)) {
      best = { index: i, keyword: kw };
    }
  }
  return best;
}

function snapToWordStart(s: string, pos: number): number {
  if (pos <= 0) return 0;
  if (pos >= s.length) return s.length;
  while (pos > 0 && /\S/.test(s[pos - 1])) pos--;
  return pos;
}

function snapToWordEnd(s: string, pos: number): number {
  if (pos >= s.length) return s.length;
  while (pos < s.length && /\S/.test(s[pos])) pos++;
  return pos;
}

const SNIPPET_RADIUS = 60;
const SNIPPET_MAX_LEN = 120;

function buildSnippetFromSearchText(
  searchText: string,
  keywords: readonly string[],
): string {
  const trimmed = searchText.trim();
  if (!trimmed) return "";

  const hit = firstKeywordIndexInText(trimmed, keywords);
  if (hit === null) return "";

  const { index: matchIdx, keyword: kw } = hit;
  let start = Math.max(0, matchIdx - SNIPPET_RADIUS);
  let end = Math.min(
    trimmed.length,
    matchIdx + kw.length + SNIPPET_RADIUS,
  );

  start = snapToWordStart(trimmed, start);
  end = snapToWordEnd(trimmed, end);

  let out = trimmed.slice(start, end);
  if (start > 0) out = `…${out}`;
  if (end < trimmed.length) out = `${out}…`;

  out = out.trim();
  if (out.length > SNIPPET_MAX_LEN) {
    out = `${out.slice(0, SNIPPET_MAX_LEN - 1)}…`;
  }
  return out;
}

function lessonMatchedKeyword(
  lesson: CourseLessonForSearch,
  kw: string,
): boolean {
  return (
    lesson.title.toLowerCase().includes(kw) ||
    safeLessonSearchText(lesson).toLowerCase().includes(kw)
  );
}

/**
 * Search courses (with nested lessons). Empty query or only stop words returns
 * one result per course with empty matchedLessons.
 * Multiple keywords use AND semantics (each keyword must match somewhere).
 */
export function searchCourses(
  courses: readonly CourseWithLessonsForSearch[],
  query: string,
): CourseSearchResult[] {
  const keywords = normalizeQueryWords(query);

  if (keywords.length === 0) {
    return courses.map((course) => ({
      course,
      matchedLessons: [],
    }));
  }

  const scored: Array<{
    result: CourseSearchResult;
    rank: 1 | 2 | 3;
  }> = [];

  for (const course of courses) {
    const { lessons: lessonList } = course;
    if (
      !keywords.every((kw) =>
        keywordMatchesCourseSomewhere(course, lessonList, kw),
      )
    ) {
      continue;
    }

    const rank = rankForCourse(course, lessonList, keywords);

    const matchedLessons: MatchedLessonResult[] = [];
    for (const lesson of lessonList) {
      const matched = keywords.some((kw) => lessonMatchedKeyword(lesson, kw));
      if (!matched) continue;

      const snippet = buildSnippetFromSearchText(
        safeLessonSearchText(lesson),
        keywords,
      );

      matchedLessons.push({ lesson, snippet });
    }

    matchedLessons.sort((a, b) => a.lesson.order - b.lesson.order);

    scored.push({
      result: { course, matchedLessons },
      rank,
    });
  }

  scored.sort((a, b) => {
    if (a.rank !== b.rank) return a.rank - b.rank;
    return a.result.course.title.localeCompare(b.result.course.title, undefined, {
      sensitivity: "base",
    });
  });

  return scored.map((s) => s.result);
}

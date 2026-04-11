import { and, asc, eq, inArray, isNull } from "drizzle-orm";
import { db } from "@/db/client";
import { courses, lessons } from "@/db/schema";
import { extractPlainText } from "@/lib/lexical-search-text";

/** Slim course shape for list/grid. Excludes order, timestamps, flags. */
export type CourseListItem = {
  id: number;
  title: string;
  description: string | null;
  thumbnailUrl: string | null;
};

/** Lesson fields used for course search (title + plain body text for match/snippet). */
export type CourseLessonForSearch = {
  id: number;
  courseId: number;
  title: string;
  /**
   * Plain text for search/snippets: DB `search_text` when set, otherwise derived
   * from `content` (Lexical JSON) on the server.
   */
  searchText: string;
  order: number;
};

/** Prefer stored search_text; if missing/empty, extract from Lexical JSON content. */
export function resolveLessonSearchText(
  searchText: string | null | undefined,
  content: string,
): string {
  const trimmed = searchText?.trim();
  if (trimmed) return trimmed;
  return extractPlainText(content);
}

export type CourseWithLessonsForSearch = CourseListItem & {
  lessons: readonly CourseLessonForSearch[];
};

export async function getCoursesList(user: {
  role?: string;
} | null): Promise<CourseListItem[]> {
  const isNewHire = user?.role === "new_hire";

  const rows = await db
    .select({
      id: courses.id,
      title: courses.title,
      description: courses.description,
      thumbnailUrl: courses.thumbnailUrl,
    })
    .from(courses)
    .where(
      isNewHire
        ? and(isNull(courses.archivedAt), eq(courses.isOnboarding, true))
        : isNull(courses.archivedAt),
    )
    .orderBy(asc(courses.order));

  return rows;
}

/** Courses with non-archived lessons (for client-side search). */
export async function getCoursesWithLessonsForSearch(user: {
  role?: string;
} | null): Promise<CourseWithLessonsForSearch[]> {
  const isNewHire = user?.role === "new_hire";

  const courseRows = await db
    .select({
      id: courses.id,
      title: courses.title,
      description: courses.description,
      thumbnailUrl: courses.thumbnailUrl,
    })
    .from(courses)
    .where(
      isNewHire
        ? and(isNull(courses.archivedAt), eq(courses.isOnboarding, true))
        : isNull(courses.archivedAt),
    )
    .orderBy(asc(courses.order));

  if (courseRows.length === 0) return [];

  const courseIds = courseRows.map((c) => c.id);

  const lessonRows = await db
    .select({
      id: lessons.id,
      courseId: lessons.courseId,
      title: lessons.title,
      searchText: lessons.searchText,
      content: lessons.content,
      order: lessons.order,
    })
    .from(lessons)
    .where(
      and(inArray(lessons.courseId, courseIds), isNull(lessons.archivedAt)),
    )
    .orderBy(asc(lessons.order));

  const byCourse = new Map<number, CourseLessonForSearch[]>();
  for (const l of lessonRows) {
    const list = byCourse.get(l.courseId) ?? [];
    list.push({
      id: l.id,
      courseId: l.courseId,
      title: l.title,
      searchText: resolveLessonSearchText(l.searchText, l.content),
      order: l.order,
    });
    byCourse.set(l.courseId, list);
  }

  return courseRows.map((c) => ({
    ...c,
    lessons: byCourse.get(c.id) ?? [],
  }));
}

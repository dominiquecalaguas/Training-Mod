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

export type LessonUpdate = {
  lessonId: number;
  courseId: number;
  lessonTitle: string;
  courseTitle: string;
  date: string;
  kind: "Added" | "Updated";
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
export async function getCourseLibrary(user: {
  role?: string;
} | null): Promise<{
  courses: CourseWithLessonsForSearch[];
  recentLessonUpdates: LessonUpdate[];
}> {
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

  if (courseRows.length === 0) return { courses: [], recentLessonUpdates: [] };

  const courseIds = courseRows.map((c) => c.id);

  const lessonRows = await db
    .select({
      id: lessons.id,
      courseId: lessons.courseId,
      title: lessons.title,
      searchText: lessons.searchText,
      content: lessons.content,
      order: lessons.order,
      createdAt: lessons.createdAt,
      updatedAt: lessons.updatedAt,
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

  const courseTitles = new Map(courseRows.map((course) => [course.id, course.title]));
  const recentLessonUpdates = lessonRows
    .map((lesson): LessonUpdate => {
      const edited = lesson.updatedAt > lesson.createdAt;
      return {
        lessonId: lesson.id,
        courseId: lesson.courseId,
        lessonTitle: lesson.title,
        courseTitle: courseTitles.get(lesson.courseId)!,
        date: (edited ? lesson.updatedAt : lesson.createdAt).toISOString(),
        kind: edited ? "Updated" : "Added",
      };
    })
    .sort((a, b) => b.date.localeCompare(a.date) || b.lessonId - a.lessonId)
    .slice(0, 3);

  return {
    courses: courseRows.map((course) => ({
      ...course,
      lessons: byCourse.get(course.id) ?? [],
    })),
    recentLessonUpdates,
  };
}

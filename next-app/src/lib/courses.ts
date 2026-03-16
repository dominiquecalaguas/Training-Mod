import { and, asc, eq, isNull } from "drizzle-orm";
import { db } from "@/db/client";
import { courses } from "@/db/schema";

/** Slim course shape for list/grid. Excludes order, timestamps, flags. */
export type CourseListItem = {
  id: number;
  title: string;
  description: string | null;
  thumbnailUrl: string | null;
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

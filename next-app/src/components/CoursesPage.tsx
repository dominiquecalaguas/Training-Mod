"use client";

import { CourseGrid } from "@/components/CourseGrid";
import styles from "./course-library.module.css";
import { useSearchQuery } from "@/components/SearchQueryContext";
import type { CourseWithLessonsForSearch } from "@/lib/courses";
import { getSearchKeywords, searchCourses } from "@/lib/search-courses";

export function CoursesPage({
  courses,
  lessonCountByCourseId = {},
}: {
  courses: CourseWithLessonsForSearch[];
  lessonCountByCourseId?: Record<number, number>;
}) {
  const { searchQuery } = useSearchQuery();
  const searchResults = searchCourses(courses, searchQuery);
  const searchKeywords = getSearchKeywords(searchQuery);
  const hasActiveSearch = searchQuery.trim() !== "";

  if (courses.length === 0) {
    return (
      <CourseGrid
        courses={courses}
        lessonCountByCourseId={lessonCountByCourseId}
      />
    );
  }

  if (searchResults.length === 0 && hasActiveSearch) {
    return (
      <div role="status" className={styles.empty}>
        <p>
          No courses match &ldquo;{searchQuery}&rdquo;
        </p>
      </div>
    );
  }

  return (
    <CourseGrid
      courses={courses}
      lessonCountByCourseId={lessonCountByCourseId}
      searchResults={hasActiveSearch ? searchResults : undefined}
      searchKeywords={hasActiveSearch ? searchKeywords : undefined}
    />
  );
}

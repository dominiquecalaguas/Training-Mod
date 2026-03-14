import posthog from "posthog-js";

/** Capture course click (course card / course link). Use stable courseId for resolver. */
export function trackCourseClicked(courseId: number) {
  try {
    posthog.capture("course_clicked", { courseId });
  } catch {
    // no-op when PostHog is not configured
  }
}

/** Capture lesson click (lesson link). Use stable courseId and lessonId for resolver. */
export function trackLessonClicked(courseId: number, lessonId: number) {
  try {
    posthog.capture("lesson_clicked", { courseId, lessonId });
  } catch {
    // no-op when PostHog is not configured
  }
}

/** Capture lesson view (lesson page loaded). Use stable courseId and lessonId for resolver. */
export function trackLessonViewed(courseId: number, lessonId: number) {
  try {
    posthog.capture("lesson_viewed", { courseId, lessonId });
  } catch {
    // no-op when PostHog is not configured
  }
}

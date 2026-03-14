"use client";

import { useEffect } from "react";
import { trackLessonViewed } from "@/lib/analytics";

export function LessonViewTracker({
  courseId,
  lessonId,
}: {
  courseId: number;
  lessonId: number;
}) {
  useEffect(() => {
    trackLessonViewed(courseId, lessonId);
  }, [courseId, lessonId]);
  return null;
}

import { asc, eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { getPageSession } from "@/auth/lucia";
import { db } from "@/db/client";
import { courses, lessons } from "@/db/schema";
import { EditCourseForm } from "./EditCourseForm";
import { AddLessonButton } from "./AddLessonButton";
import { EditableLessonList } from "./EditableLessonList";

export const dynamic = "force-dynamic";

export default async function EditCoursePage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { user } = await getPageSession();
  if (!user) {
    redirect(`/login?from=${encodeURIComponent("/admin/courses")}`);
  }
  if (user.role !== "admin") {
    redirect("/?forbidden=1");
  }

  const { courseId: courseIdParam } = await params;
  const id = Number(courseIdParam);
  if (Number.isNaN(id)) notFound();

  const [course] = await db
    .select()
    .from(courses)
    .where(eq(courses.id, id))
    .limit(1);

  if (!course) notFound();

  const courseLessons = await db
    .select()
    .from(lessons)
    .where(eq(lessons.courseId, id))
    .orderBy(asc(lessons.order));

  const lessonsKey = courseLessons.map((lesson) => lesson.id).join(",");

  return (
    <div className="flex flex-col gap-8">
      <div className="rounded-xl border border-zinc-200 bg-white p-6">
        <h2 className="text-lg font-semibold tracking-tight">Edit course</h2>
        <EditCourseForm course={course} />
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-6">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-lg font-semibold tracking-tight">Lessons</h2>
          <AddLessonButton courseId={id} nextOrder={courseLessons.length + 1} />
        </div>
        <div className="mt-4 space-y-2">
          {courseLessons.length === 0 ? (
            <p className="text-sm text-zinc-500">
              No lessons yet. Click Add lesson above to create one.
            </p>
          ) : (
            <EditableLessonList
              key={lessonsKey}
              lessons={courseLessons.map((l) => ({
                id: l.id,
                courseId: l.courseId,
                title: l.title,
                content: l.content,
                order: l.order,
                updatedAt: l.updatedAt,
              }))}
              courseId={id}
            />
          )}
          <p className="text-[11px] text-zinc-500">
            Add, remove, and reorder lessons. You can add content to each lesson
            in the expanded section below.
          </p>
        </div>
      </div>
    </div>
  );
}

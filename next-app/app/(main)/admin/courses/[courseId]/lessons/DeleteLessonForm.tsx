"use client";

type DeleteLessonFormProps = {
  deleteLesson: (formData: FormData) => Promise<void>;
  lessonId: number;
  courseId: number;
};

export function DeleteLessonForm({
  deleteLesson,
  lessonId,
  courseId,
}: DeleteLessonFormProps) {
  return (
    <form
      action={deleteLesson}
      onSubmit={(e) => {
        if (!confirm("Delete this lesson? This cannot be undone.")) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={lessonId} />
      <input type="hidden" name="courseId" value={courseId} />
      <button
        type="submit"
        className="rounded-full border border-red-200 px-3 py-1 text-xs text-red-600 hover:bg-red-50"
      >
        Delete
      </button>
    </form>
  );
}

"use client";

import { useTransition } from "react";

const MESSAGE =
  "Delete this course and all of its lessons? This cannot be undone.";

type Props = {
  action: (formData: FormData) => void | Promise<void>;
  courseId: number;
};

export function DeleteCourseForm({ action, courseId }: Props) {
  const [isPending, startTransition] = useTransition();

  return (
    <form
      action={(formData) => startTransition(() => action(formData))}
      onSubmit={(e) => {
        if (!confirm(MESSAGE)) e.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={courseId} />
      <button
        type="submit"
        disabled={isPending}
        className="rounded-full border border-red-200 px-3 py-1 text-xs text-red-600 hover:bg-red-50 disabled:opacity-50"
      >
        {isPending ? "…" : "Delete"}
      </button>
    </form>
  );
}

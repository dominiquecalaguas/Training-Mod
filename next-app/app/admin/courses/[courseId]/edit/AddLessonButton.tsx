"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { createLesson } from "../../../actions";

export function AddLessonButton({
  courseId,
  nextOrder,
}: {
  courseId: number;
  nextOrder: number;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  const handleClick = async () => {
    setPending(true);
    try {
      const formData = new FormData();
      formData.set("courseId", String(courseId));
      formData.set("title", "Untitled lesson");
      formData.set("content", "");
      formData.set("order", String(nextOrder));
      await createLesson(formData);
      router.refresh();
    } finally {
      setPending(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className="inline-flex items-center gap-1.5 rounded-full border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-100 disabled:opacity-50 disabled:pointer-events-none"
    >
      <Plus className="size-3.5" />
      {pending ? "Adding…" : "Add lesson"}
    </button>
  );
}

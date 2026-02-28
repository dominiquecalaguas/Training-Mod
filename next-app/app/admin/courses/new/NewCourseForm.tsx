"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { SerializedEditorState } from "lexical";
import { GripVertical, Loader2, Plus, Trash2 } from "lucide-react";

import { Editor } from "@/components/blocks/editor-x/editor";

type PendingLesson = { title: string; order: number };

const initialEditorValue = {
  root: {
    children: [
      {
        children: [
          {
            detail: 0,
            format: 0,
            mode: "normal",
            style: "",
            text: "",
            type: "text",
            version: 1,
          },
        ],
        direction: "ltr",
        format: "",
        indent: 0,
        type: "paragraph",
        version: 1,
      },
    ],
    direction: "ltr",
    format: "",
    indent: 0,
    type: "root",
    version: 1,
  },
} as unknown as SerializedEditorState;

const initialLessons: PendingLesson[] = [{ title: "", order: 1 }];

export function NewCourseForm({
  action,
}: {
  action: (formData: FormData) => Promise<void>;
}) {
  const router = useRouter();
  const [descriptionState, setDescriptionState] =
    useState<SerializedEditorState | null>(initialEditorValue);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingLessons, setPendingLessons] =
    useState<PendingLesson[]>(initialLessons);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const flushDescriptionToForm = useCallback(
    (form: HTMLFormElement) => {
      const hidden = form.querySelector<HTMLInputElement>(
        'input[name="description"]',
      );
      if (hidden && descriptionState) {
        hidden.value = JSON.stringify(descriptionState);
      }
    },
    [descriptionState],
  );

  const normalizedLessons = pendingLessons.map((l, i) => ({
    ...l,
    order: i + 1,
  }));

  const addLesson = useCallback(() => {
    setPendingLessons((prev) => [
      ...prev,
      { title: "", order: prev.length + 1 },
    ]);
  }, []);

  const removeLesson = useCallback((index: number) => {
    setPendingLessons((prev) => {
      if (prev.length <= 1) return prev;
      const next = prev.filter((_, i) => i !== index);
      return next.map((l, i) => ({ ...l, order: i + 1 }));
    });
  }, []);

  const updateLessonTitle = useCallback((index: number, title: string) => {
    setPendingLessons((prev) =>
      prev.map((l, i) => (i === index ? { ...l, title } : l)),
    );
  }, []);

  const handleDragStart = useCallback(
    (e: React.DragEvent, index: number) => {
      e.dataTransfer.setData("text/plain", String(index));
      e.dataTransfer.effectAllowed = "move";
      setDraggedIndex(index);
    },
    [],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent, dropIndex: number) => {
      e.preventDefault();
      const raw = e.dataTransfer.getData("text/plain");
      const dragIndex = raw === "" ? NaN : Number(raw);
      if (Number.isNaN(dragIndex) || dragIndex === dropIndex) {
        setDraggedIndex(null);
        return;
      }
      setPendingLessons((prev) => {
        const next = [...prev];
        const [removed] = next.splice(dragIndex, 1);
        next.splice(dropIndex, 0, removed);
        return next.map((l, i) => ({ ...l, order: i + 1 }));
      });
      setDraggedIndex(null);
    },
    [],
  );

  const handleDragEnd = useCallback(() => {
    setDraggedIndex(null);
  }, []);

  const handleSubmit = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      const form = e.currentTarget;
      flushDescriptionToForm(form);
      const lessonsInput = form.querySelector<HTMLInputElement>(
        'input[name="lessons"]',
      );
      if (lessonsInput) {
        lessonsInput.value = JSON.stringify(normalizedLessons);
      }
      setIsSubmitting(true);
    },
    [flushDescriptionToForm, normalizedLessons],
  );

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-6">
      <h2 className="text-lg font-semibold tracking-tight">New course</h2>
      <form
        action={action}
        className="mt-4 grid gap-4 sm:grid-cols-2"
        onSubmit={handleSubmit}
      >
        <label className="text-xs font-medium text-zinc-700 sm:col-span-2">
          Title
          <input
            type="text"
            name="title"
            required
            className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900"
          />
        </label>
        <div className="sm:col-span-2 space-y-2">
          <div className="text-xs font-medium text-zinc-700">Description</div>
          <input type="hidden" name="description" />
          <div className="relative w-full min-h-[400px] overflow-hidden rounded-lg border border-zinc-200">
            <Editor
              editorSerializedState={descriptionState ?? undefined}
              onSerializedChange={(value) => setDescriptionState(value)}
            />
          </div>
        </div>
        <label className="text-xs font-medium text-zinc-700 sm:col-span-2">
          Thumbnail
          <input
            type="file"
            name="thumbnail"
            accept="image/*"
            className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm file:mr-3 file:rounded-full file:border-0 file:bg-zinc-100 file:px-4 file:py-1.5 file:text-sm file:font-medium file:text-zinc-700 focus:outline-none focus:border-zinc-900"
          />
        </label>
        <input type="hidden" name="lessons" />
        <div className="sm:col-span-2 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-zinc-700">Lessons</span>
            <button
              type="button"
              onClick={addLesson}
              className="inline-flex items-center gap-1.5 rounded-full border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-100"
            >
              <Plus className="size-3.5" />
              Add lesson
            </button>
          </div>
          <ul className="divide-y divide-zinc-100 rounded-lg border border-zinc-200 bg-zinc-50/50">
            {pendingLessons.map((lesson, index) => (
              <li
                key={index}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, index)}
                className={`flex items-center gap-3 px-3 py-2 ${draggedIndex === index ? "opacity-50" : ""}`}
              >
                <div
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragEnd={handleDragEnd}
                  className="cursor-grab touch-none text-zinc-400 hover:text-zinc-600 active:cursor-grabbing"
                  aria-label="Drag to reorder"
                >
                  <GripVertical className="size-4" />
                </div>
                <input
                  type="text"
                  value={lesson.title}
                  onChange={(e) => updateLessonTitle(index, e.target.value)}
                  placeholder="Lesson title"
                  className="flex-1 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-900"
                />
                <button
                  type="button"
                  onClick={() => removeLesson(index)}
                  disabled={pendingLessons.length <= 1}
                  className="rounded-full p-2 text-zinc-500 hover:bg-zinc-200 hover:text-zinc-700 disabled:pointer-events-none disabled:opacity-50"
                  aria-label="Remove lesson"
                >
                  <Trash2 className="size-4" />
                </button>
              </li>
            ))}
          </ul>
          <p className="text-[11px] text-zinc-500">
            Add, remove, and reorder lessons. You can add content to each lesson
            after creating the course.
          </p>
        </div>
        <div className="sm:col-span-2 flex items-center gap-3">
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-zinc-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-zinc-800 disabled:pointer-events-none disabled:opacity-70 min-w-[7rem]"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Creating…
              </>
            ) : (
              "Create course"
            )}
          </button>
          <button
            type="button"
            className="inline-flex items-center rounded-full border border-zinc-300 px-4 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-100 disabled:pointer-events-none disabled:opacity-70"
            onClick={() => router.back()}
            disabled={isSubmitting}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}


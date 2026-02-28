"use client";

import { useState, useCallback } from "react";
import type { SerializedEditorState } from "lexical";
import { ChevronDown, ChevronRight, GripVertical } from "lucide-react";
import { Editor } from "@/components/blocks/editor-x/editor";
import { setLessonsOrder, updateLesson } from "../../../actions";

type Lesson = {
  id: number;
  courseId: number;
  title: string;
  content: string;
  order: number;
};

const emptyLexicalState: SerializedEditorState = {
  root: {
    children: [
      {
        children: [
          {
            detail: 0,
            format: "",
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
};

function parseLessonContent(content: string): SerializedEditorState {
  const trimmed = content?.trim() ?? "";
  if (!trimmed) return emptyLexicalState;
  if (trimmed.startsWith("{") && trimmed.includes('"root"')) {
    try {
      const parsed = JSON.parse(trimmed) as unknown;
      if (parsed && typeof parsed === "object" && "root" in parsed)
        return parsed as SerializedEditorState;
    } catch {
      // fall through to plain text
    }
  }
  return {
    ...emptyLexicalState,
    root: {
      ...emptyLexicalState.root,
      children: [
        {
          children: [
            {
              detail: 0,
              format: "",
              mode: "normal",
              style: "",
              text: trimmed,
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
    },
  };
}

export function EditableLessonList({
  lessons: initialLessons,
  courseId,
}: {
  lessons: Lesson[];
  courseId: number;
}) {
  const [lessons, setLessons] = useState(initialLessons);
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [contentStateByLessonId, setContentStateByLessonId] = useState<
    Record<number, SerializedEditorState>
  >({});

  const toggleExpanded = useCallback((lessonId: number) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(lessonId)) next.delete(lessonId);
      else next.add(lessonId);
      return next;
    });
  }, []);

  const handleDragStart = useCallback(
    (e: React.DragEvent, index: number) => {
      e.dataTransfer.setData("text/plain", String(lessons[index].id));
      e.dataTransfer.effectAllowed = "move";
      setDraggedIndex(index);
    },
    [lessons],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent, dropIndex: number) => {
      e.preventDefault();
      const idStr = e.dataTransfer.getData("text/plain");
      const draggedId = idStr ? Number(idStr) : null;
      if (draggedId == null) {
        setDraggedIndex(null);
        return;
      }
      const dragIndex = lessons.findIndex((l) => l.id === draggedId);
      if (dragIndex === -1 || dragIndex === dropIndex) {
        setDraggedIndex(null);
        return;
      }
      const newLessons = [...lessons];
      const [removed] = newLessons.splice(dragIndex, 1);
      newLessons.splice(dropIndex, 0, removed);
      setLessons(newLessons);
      setDraggedIndex(null);

      const formData = new FormData();
      formData.append("courseId", String(courseId));
      newLessons.forEach((l) => formData.append("ids", String(l.id)));
      setLessonsOrder(formData);
    },
    [lessons, courseId],
  );

  const handleDragEnd = useCallback(() => {
    setDraggedIndex(null);
  }, []);

  return (
    <ul className="flex flex-col gap-1">
      {lessons.map((lesson, index) => {
        const isExpanded = expandedIds.has(lesson.id);
        return (
          <li
            key={lesson.id}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, index)}
            className={`rounded-lg border border-zinc-200 bg-white ${draggedIndex === index ? "opacity-50" : ""}`}
          >
            <div
              className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-zinc-50"
              onClick={() => toggleExpanded(lesson.id)}
            >
              <div
                draggable
                onClick={(e) => e.stopPropagation()}
                onDragStart={(e) => handleDragStart(e, index)}
                onDragEnd={handleDragEnd}
                className="cursor-grab touch-none text-zinc-400 hover:text-zinc-600 active:cursor-grabbing"
                aria-label="Drag to reorder"
              >
                <GripVertical className="size-4" />
              </div>
              <span className="text-zinc-500">
                {isExpanded ? (
                  <ChevronDown className="size-4" />
                ) : (
                  <ChevronRight className="size-4" />
                )}
              </span>
              <span className="text-sm font-medium text-zinc-800 truncate">
                {lesson.title || `Lesson ${lesson.order}`}
              </span>
            </div>
            {isExpanded && (
              <div className="border-t border-zinc-100 bg-zinc-50/50 p-4">
                <form
                  action={updateLesson}
                  className="grid gap-4 sm:grid-cols-2"
                  onClick={(e) => e.stopPropagation()}
                  onSubmit={(e) => {
                    const form = e.currentTarget;
                    const contentInput =
                      form.querySelector<HTMLInputElement>(
                        'input[name="content"]',
                      );
                    if (contentInput) {
                      const state =
                        contentStateByLessonId[lesson.id] ??
                        parseLessonContent(lesson.content);
                      contentInput.value = JSON.stringify(state);
                    }
                  }}
                >
                  <input type="hidden" name="id" value={lesson.id} />
                  <input type="hidden" name="courseId" value={courseId} />
                  <input type="hidden" name="order" value={lesson.order} />
                  <input type="hidden" name="content" />
                  <label className="text-xs font-medium text-zinc-700 sm:col-span-2">
                    Title
                    <input
                      type="text"
                      name="title"
                      defaultValue={lesson.title}
                      required
                      className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900"
                    />
                  </label>
                  <div className="sm:col-span-2 space-y-2">
                    <div className="text-xs font-medium text-zinc-700">
                      Content
                    </div>
                    <div className="relative min-h-[300px] overflow-hidden rounded-lg border border-zinc-200">
                      <Editor
                        editorSerializedState={
                          contentStateByLessonId[lesson.id] ??
                          parseLessonContent(lesson.content)
                        }
                        onSerializedChange={(state) =>
                          setContentStateByLessonId((prev) => ({
                            ...prev,
                            [lesson.id]: state,
                          }))
                        }
                      />
                    </div>
                  </div>
                  <div className="sm:col-span-2">
                    <button
                      type="submit"
                      className="inline-flex items-center rounded-full bg-zinc-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-zinc-800"
                    >
                      Save lesson
                    </button>
                  </div>
                </form>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

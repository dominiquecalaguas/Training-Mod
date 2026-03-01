"use client";

import { useState, useCallback, Fragment, useEffect } from "react";
import type { SerializedEditorState } from "lexical";
import { ChevronDown, ChevronRight, GripVertical, Trash2 } from "lucide-react";
import { Editor } from "@/components/blocks/editor-x/editor";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { setLessonsOrder, deleteLesson, updateLesson } from "../../../actions";

type Lesson = {
  id: number;
  courseId: number;
  title: string;
  content: string;
  order: number;
  updatedAt?: string | Date | null;
};

const emptyLexicalState = {
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
} as unknown as SerializedEditorState;

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
  } as unknown as SerializedEditorState;
}

export function EditableLessonList({
  lessons: initialLessons,
  courseId,
}: {
  lessons: Lesson[];
  courseId: number;
}) {
  const [lessons, setLessons] = useState(initialLessons);

  // Sync from server when list changes (e.g. after Add lesson + router.refresh)
  const initialIdsKey = initialLessons.map((l) => l.id).join(",");
  useEffect(() => {
    setLessons(initialLessons);
  }, [initialIdsKey]); // eslint-disable-line react-hooks/exhaustive-deps -- only sync when server list identity changes

  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dropIndicatorBeforeIndex, setDropIndicatorBeforeIndex] = useState<
    number | null
  >(null);
  const [deleteConfirmLessonId, setDeleteConfirmLessonId] = useState<
    number | null
  >(null);
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

      const li = (e.target as HTMLElement).closest("li");
      const row = li?.querySelector(":scope > div:first-of-type") as
        | HTMLElement
        | undefined;
      if (row) {
        const rect = row.getBoundingClientRect();
        const ghost = row.cloneNode(true) as HTMLElement;
        ghost.style.opacity = "0.6";
        ghost.style.position = "fixed";
        ghost.style.left = "-9999px";
        ghost.style.top = "0";
        ghost.style.pointerEvents = "none";
        ghost.style.width = `${rect.width}px`;
        ghost.style.backgroundColor = "rgb(250 250 250)";
        ghost.style.border = "1px solid rgb(228 228 231)";
        ghost.style.borderRadius = "8px";
        ghost.style.boxSizing = "border-box";
        document.body.appendChild(ghost);
        const offsetX = e.clientX - rect.left;
        const offsetY = e.clientY - rect.top;
        e.dataTransfer.setDragImage(ghost, offsetX, offsetY);
        requestAnimationFrame(() => ghost.remove());
      }
    },
    [lessons],
  );

  const getInsertBeforeIndex = useCallback(
    (e: React.DragEvent, itemIndex: number): number => {
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const mid = rect.top + rect.height / 2;
      return e.clientY < mid ? itemIndex : itemIndex + 1;
    },
    [],
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent, index: number) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      const insertBefore = Math.min(
        Math.max(0, getInsertBeforeIndex(e, index)),
        lessons.length,
      );
      setDropIndicatorBeforeIndex(insertBefore);
    },
    [lessons.length, getInsertBeforeIndex],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent, dropIndex: number) => {
      e.preventDefault();
      const idStr = e.dataTransfer.getData("text/plain");
      const draggedId = idStr ? Number(idStr) : null;
      if (draggedId == null) {
        setDraggedIndex(null);
        setDropIndicatorBeforeIndex(null);
        return;
      }
      const dragIndex = lessons.findIndex((l) => l.id === draggedId);
      if (dragIndex === -1 || dragIndex === dropIndex) {
        setDraggedIndex(null);
        setDropIndicatorBeforeIndex(null);
        return;
      }
      const newLessons = [...lessons];
      const [removed] = newLessons.splice(dragIndex, 1);
      newLessons.splice(dropIndex, 0, removed);
      setLessons(newLessons);
      setDraggedIndex(null);
      setDropIndicatorBeforeIndex(null);

      const formData = new FormData();
      formData.append("courseId", String(courseId));
      newLessons.forEach((l) => formData.append("ids", String(l.id)));
      setLessonsOrder(formData);
    },
    [lessons, courseId],
  );

  const handleDragEnd = useCallback(() => {
    setDraggedIndex(null);
    setDropIndicatorBeforeIndex(null);
  }, []);

  const handleDeleteConfirm = useCallback(
    async (formData: FormData) => {
      await deleteLesson(formData);
      const id = Number(formData.get("id") || "0");
      if (id) setLessons((prev) => prev.filter((l) => l.id !== id));
      setDeleteConfirmLessonId(null);
    },
    [],
  );

  return (
    <>
      <ul className="divide-y divide-zinc-100 rounded-lg border border-zinc-200 bg-zinc-50/50">
        {lessons.map((lesson, index) => {
          const isExpanded = expandedIds.has(lesson.id);
          return (
            <Fragment key={lesson.id}>
              {dropIndicatorBeforeIndex === index && (
                <li className="list-none" aria-hidden>
                  <div className="min-h-[2px] w-full bg-zinc-900" style={{ height: 2 }} />
                </li>
              )}
              <li
                onDragOver={(e) => handleDragOver(e, index)}
                onDrop={(e) => {
                  const insertBefore = getInsertBeforeIndex(e, index);
                  handleDrop(e, insertBefore);
                }}
                className={`flex flex-col ${draggedIndex === index ? "opacity-50" : ""}`}
              >
              <div
                className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-zinc-100/80"
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
                <span className="text-zinc-500 shrink-0">
                  {isExpanded ? (
                    <ChevronDown className="size-4" />
                  ) : (
                    <ChevronRight className="size-4" />
                  )}
                </span>
                <span className="flex-1 min-w-0 px-3 py-2 text-sm text-zinc-900">
                  {lesson.title || "Untitled lesson"}
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteConfirmLessonId(lesson.id);
                  }}
                  className="shrink-0 rounded-full p-2 text-zinc-500 hover:bg-zinc-200 hover:text-zinc-700"
                  aria-label="Remove lesson"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            {isExpanded && (
              <div className="border-t border-zinc-100 bg-zinc-50/50 p-4">
                <form
                  className="grid gap-4 sm:grid-cols-2"
                  onClick={(e) => e.stopPropagation()}
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const form = e.currentTarget;
                    const titleInput =
                      form.querySelector<HTMLInputElement>(
                        'input[name="title"]',
                      );
                    const contentInput =
                      form.querySelector<HTMLInputElement>(
                        'input[name="content"]',
                      );
                    const title =
                      titleInput?.value?.trim() ?? lesson.title;
                    const state =
                      contentStateByLessonId[lesson.id] ??
                      parseLessonContent(lesson.content);
                    const content = JSON.stringify(state);
                    if (contentInput) contentInput.value = content;
                    const formData = new FormData();
                    formData.set("id", String(lesson.id));
                    formData.set("courseId", String(courseId));
                    formData.set("order", String(lesson.order));
                    formData.set("title", title);
                    formData.set("content", content);
                    await updateLesson(formData);
                    setLessons((prev) =>
                      prev.map((l) =>
                        l.id === lesson.id
                          ? {
                              ...l,
                              title,
                              content,
                              updatedAt: new Date(),
                            }
                          : l,
                      ),
                    );
                    setContentStateByLessonId((prev) => ({
                      ...prev,
                      [lesson.id]: state,
                    }));
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
                  <div className="sm:col-span-2 flex flex-wrap items-center gap-3">
                    <button
                      type="submit"
                      className="inline-flex items-center rounded-full bg-zinc-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-zinc-800"
                    >
                      Save lesson
                    </button>
                    {lesson.updatedAt && (
                      <span className="text-sm italic text-zinc-500">
                        Last modified on{" "}
                        {new Date(lesson.updatedAt).toLocaleString(undefined, {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </span>
                    )}
                  </div>
                </form>
              </div>
            )}
              </li>
            </Fragment>
          );
        })}
        {dropIndicatorBeforeIndex === lessons.length && (
          <li className="list-none" aria-hidden>
            <div className="min-h-[2px] w-full bg-zinc-900" style={{ height: 2 }} />
          </li>
        )}
      </ul>

      <Dialog
        open={deleteConfirmLessonId !== null}
        onOpenChange={(open) => !open && setDeleteConfirmLessonId(null)}
      >
        <DialogContent
          showCloseButton={true}
          className="bg-white text-zinc-900 border-zinc-200 [&_[data-slot=dialog-close]]:text-zinc-500 [&_[data-slot=dialog-close]]:hover:text-zinc-900"
        >
          <DialogHeader>
            <DialogTitle className="text-zinc-900">
              Delete lesson?
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-zinc-600">
            This lesson will be removed. This cannot be undone.
          </p>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (deleteConfirmLessonId == null) return;
              const formData = new FormData();
              formData.set("id", String(deleteConfirmLessonId));
              formData.set("courseId", String(courseId));
              await handleDeleteConfirm(formData);
            }}
            className="flex flex-col gap-4"
          >
            <DialogFooter>
              <button
                type="button"
                onClick={() => setDeleteConfirmLessonId(null)}
                className="rounded-full border border-zinc-300 bg-white px-4 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-full bg-red-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-red-700"
              >
                Delete
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

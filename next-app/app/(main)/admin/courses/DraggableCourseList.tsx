"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { GripVertical } from "lucide-react";
import type { CoursePreviewRow } from "./page";
import { DeleteCourseForm } from "./DeleteCourseForm";
import { deleteCourse, setCoursesOrder } from "../actions";

type Row = CoursePreviewRow;

export function DraggableCourseList({ rows: initialRows }: { rows: Row[] }) {
  const [rows, setRows] = useState(initialRows);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const handleCourseDeleted = useCallback(
    (courseId: number) => {
      setRows((prev) => prev.filter((row) => row.course.id !== courseId));
    },
    [],
  );

  const handleDragStart = useCallback(
    (e: React.DragEvent, index: number) => {
      e.dataTransfer.setData("text/plain", String(rows[index].course.id));
      e.dataTransfer.effectAllowed = "move";
      setDraggedIndex(index);
    },
    [rows],
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
      const dragIndex = rows.findIndex((r) => r.course.id === draggedId);
      if (dragIndex === -1 || dragIndex === dropIndex) {
        setDraggedIndex(null);
        return;
      }
      const newRows = [...rows];
      const [removed] = newRows.splice(dragIndex, 1);
      newRows.splice(dropIndex, 0, removed);
      setRows(newRows);
      setDraggedIndex(null);

      const formData = new FormData();
      newRows.forEach((row) => formData.append("ids", String(row.course.id)));
      setCoursesOrder(formData);
    },
    [rows],
  );

  const handleDragEnd = useCallback(() => {
    setDraggedIndex(null);
  }, []);

  if (rows.length === 0) {
    return (
      <p className="px-4 py-6 text-sm text-zinc-500">
        No courses yet. Create your first course above.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-zinc-100 text-sm">
      {rows.map((row, index) => (
        <li
          key={row.course.id}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, index)}
          className={`flex items-center gap-3 px-4 py-3 ${draggedIndex === index ? "opacity-50" : ""}`}
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
          <div className="flex flex-1 flex-col min-w-0">
            <span className="font-medium text-zinc-900 truncate">
              {row.course.title}
            </span>
            <span className="text-xs text-zinc-500">
              {row.lessonCount} lessons
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link
              href={`/admin/courses/${row.course.id}/edit`}
              className="rounded-full border border-zinc-200 px-3 py-1 text-xs text-zinc-700 hover:bg-zinc-100"
            >
              Edit
            </Link>
            <DeleteCourseForm
              action={deleteCourse}
              courseId={row.course.id}
              onDeleted={handleCourseDeleted}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

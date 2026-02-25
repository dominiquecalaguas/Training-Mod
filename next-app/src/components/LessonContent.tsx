"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { useDeviceToken } from "@/src/components/DeviceTokenProvider";

export function LessonContent({
  courseId,
  lessonId,
  title,
  content,
}: {
  courseId: number;
  lessonId: number;
  title: string;
  content: string;
}) {
  const deviceToken = useDeviceToken();
  const [saving, setSaving] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleMarkComplete() {
    try {
      setSaving(true);
      setError(null);
      const res = await fetch("/api/progress/lesson", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ deviceToken, courseId, lessonId }),
      });
      if (!res.ok) {
        throw new Error("Failed to save progress");
      }
      setCompleted(true);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <article className="flex flex-col gap-6">
      <header className="flex flex-col gap-2 border-b border-neutral-800 pb-4">
        <h1 className="text-xl font-semibold tracking-tight text-neutral-50">
          {title}
        </h1>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleMarkComplete}
            disabled={saving || completed}
            className="inline-flex items-center rounded-full bg-emerald-500 px-4 py-1.5 text-sm font-medium text-emerald-950 shadow-sm hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-emerald-700/60 disabled:text-emerald-100"
          >
            {completed ? "Completed" : saving ? "Saving…" : "Mark complete"}
          </button>
          {completed && (
            <span className="text-xs font-medium text-emerald-300">
              Progress saved for this device.
            </span>
          )}
          {error && (
            <span className="text-xs text-red-400">
              {error} — please try again.
            </span>
          )}
        </div>
      </header>
      <section className="prose prose-sm max-w-none prose-invert prose-headings:mt-4 prose-headings:mb-2 prose-p:my-2 prose-li:my-1">
        <ReactMarkdown>{content}</ReactMarkdown>
      </section>
    </article>
  );
}


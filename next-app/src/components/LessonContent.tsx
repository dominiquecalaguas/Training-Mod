"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { useDeviceToken } from "@//components/DeviceTokenProvider";
import { LexicalViewer } from "@/components/blocks/editor-x/lexical-viewer";

function isLexicalContent(content: string): boolean {
  const trimmed = content?.trim() ?? "";
  if (!trimmed.startsWith("{") || !trimmed.includes('"root"')) return false;
  try {
    const parsed = JSON.parse(trimmed) as unknown;
    return (
      parsed != null &&
      typeof parsed === "object" &&
      "root" in parsed &&
      parsed.root != null
    );
  } catch {
    return false;
  }
}

export function LessonContent({
  courseId,
  lessonId,
  title,
  content,
  nextLessonHref,
}: {
  courseId: number;
  lessonId: number;
  title: string;
  content: string;
  nextLessonHref?: string;
}) {
  const deviceToken = useDeviceToken();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function loadProgress() {
      const res = await fetch(
        `/api/progress/lessons?deviceToken=${encodeURIComponent(
          deviceToken,
        )}&courseId=${courseId}`,
      );
      if (!res.ok || cancelled) return;
      const data = (await res.json()) as Record<number, boolean>;
      if (!cancelled) setCompleted(!!data[lessonId]);
    }
    loadProgress();
    return () => {
      cancelled = true;
    };
  }, [courseId, deviceToken, lessonId]);

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
      if (nextLessonHref) {
        router.push(nextLessonHref);
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <article className="flex flex-col gap-6">
      <header className="flex flex-col gap-2 border-b border-neutral-200 pb-4">
        <h1 className="text-xl font-semibold tracking-tight text-neutral-900">
          {title}
        </h1>
      </header>
      <section className="prose prose-sm prose-neutral max-w-none prose-headings:mt-4 prose-headings:mb-2 prose-p:my-2 prose-li:my-1">
        {isLexicalContent(content) ? (
          <LexicalViewer
            key={lessonId}
            serializedState={JSON.parse(content)}
            className="lesson-lexical-content"
          />
        ) : (
          <ReactMarkdown>{content}</ReactMarkdown>
        )}
      </section>
      <div
        className="border-t border-neutral-200 pt-6"
        style={{ borderTopWidth: 0.5 }}
      >
        <button
          type="button"
          onClick={handleMarkComplete}
          disabled={saving || completed}
          className="w-full rounded-lg bg-neutral-700 px-4 py-3 text-sm font-medium text-white shadow-sm hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-500"
        >
          {completed ? "Completed" : saving ? "Saving…" : "Complete lesson →"}
        </button>
        {error && (
          <p className="mt-2 text-xs text-red-600">
            {error} — please try again.
          </p>
        )}
      </div>
    </article>
  );
}


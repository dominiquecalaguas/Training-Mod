"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useDeviceToken } from "@//components/DeviceTokenProvider";
import { LexicalViewer } from "@/components/blocks/editor-x/lexical-viewer";
import posthog from "posthog-js";

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
  onProgressChange,
}: {
  courseId: number;
  lessonId: number;
  title: string;
  content: string;
  nextLessonHref?: string;
  /** Called when lesson is marked complete or not complete so parent can refresh sidebar. */
  onProgressChange?: () => void;
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
      posthog.capture("lesson_completed", { courseId, lessonId });
      setCompleted(true);
      onProgressChange?.();
      if (nextLessonHref) {
        router.push(nextLessonHref);
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function handleMarkIncomplete() {
    try {
      setSaving(true);
      setError(null);
      const res = await fetch("/api/progress/lesson", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ deviceToken, lessonId }),
      });
      if (!res.ok) {
        throw new Error("Failed to update progress");
      }
      posthog.capture("lesson_uncompleted", { courseId, lessonId });
      setCompleted(false);
      onProgressChange?.();
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
          onClick={completed ? handleMarkIncomplete : handleMarkComplete}
          disabled={saving}
          className={`w-full rounded-lg px-4 py-3 text-sm font-medium shadow-sm disabled:cursor-not-allowed ${
            completed
              ? "bg-neutral-200 text-neutral-600 hover:bg-neutral-300"
              : "bg-neutral-700 text-white hover:bg-neutral-800 disabled:bg-neutral-500"
          }`}
        >
          {saving ? (
            "Saving…"
          ) : completed ? (
            <span className="inline-flex items-center justify-center gap-2">
              <Check className="size-4" strokeWidth={2.5} />
              Completed
            </span>
          ) : (
            "Complete lesson →"
          )}
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


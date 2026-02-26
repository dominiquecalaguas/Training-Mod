"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { SerializedEditorState } from "lexical";

import { Editor } from "@/components/blocks/editor-x/editor";

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

export function NewCourseForm({
  action,
}: {
  action: (formData: FormData) => Promise<void>;
}) {
  const router = useRouter();
  const [descriptionState, setDescriptionState] =
    useState<SerializedEditorState | null>(initialEditorValue);

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-6">
      <h2 className="text-lg font-semibold tracking-tight">New course</h2>
      <form
        action={action}
        className="mt-4 grid gap-4 sm:grid-cols-2"
        onSubmit={(e) => {
          const form = e.currentTarget;
          const hidden = form.querySelector<HTMLInputElement>(
            'input[name="description"]',
          );
          if (hidden && descriptionState) {
            hidden.value = JSON.stringify(descriptionState);
          }
        }}
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
          <Editor
            editorSerializedState={descriptionState ?? undefined}
            onSerializedChange={(value) => setDescriptionState(value)}
          />
        </div>
        <label className="text-xs font-medium text-zinc-700">
          Thumbnail URL
          <input
            type="url"
            name="thumbnailUrl"
            className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900"
          />
        </label>
        <label className="text-xs font-medium text-zinc-700">
          Order
          <input
            type="number"
            name="order"
            defaultValue={0}
            className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900"
          />
        </label>
        <div className="sm:col-span-2 flex items-center gap-3">
          <button
            type="submit"
            className="inline-flex items-center rounded-full bg-zinc-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-zinc-800"
          >
            Create course
          </button>
          <button
            type="button"
            className="inline-flex items-center rounded-full border border-zinc-300 px-4 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
            onClick={() => router.back()}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}


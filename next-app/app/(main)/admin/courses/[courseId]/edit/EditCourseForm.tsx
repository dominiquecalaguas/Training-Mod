"use client";

import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { updateCourse } from "../../../actions";
import { ThumbnailUploadField } from "@/components/ThumbnailUploadField";
import { cn } from "@/lib/utils";

/** Fields required by this form (matches `courses` row from the DB). */
export type EditCourseFormCourse = {
  id: number;
  title: string;
  description: string | null;
  thumbnailUrl: string | null;
  isOnboarding: boolean;
};

function SaveChangesButton({
  formError,
  showSaved,
}: {
  formError: string | null;
  showSaved: boolean;
}) {
  const { pending } = useFormStatus();
  let label = "Save changes";
  if (pending) label = "Saving…";
  else if (showSaved) label = "Saved";

  return (
    <div className="flex flex-col gap-2">
      {formError ? (
        <p className="text-sm text-red-600" role="alert">
          {formError}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className={cn(
          "inline-flex items-center rounded-full px-4 py-1.5 text-sm font-medium text-white transition-colors",
          pending && "cursor-wait opacity-90",
          showSaved && !pending
            ? "bg-emerald-700 hover:bg-emerald-700"
            : "bg-zinc-900 hover:bg-zinc-800",
        )}
      >
        {label}
      </button>
    </div>
  );
}

export function EditCourseForm({ course }: { course: EditCourseFormCourse }) {
  const router = useRouter();
  const [state, formAction] = useActionState(updateCourse, null);

  useEffect(() => {
    if (state?.ok === true) {
      router.refresh();
    }
  }, [state, router]);

  const formError = state?.ok === false ? state.error : null;
  const showSaved = state?.ok === true;

  return (
    <form action={formAction} className="mt-4 grid gap-4 sm:grid-cols-2">
      <input type="hidden" name="id" value={course.id} />
      <label className="text-xs font-medium text-zinc-700 sm:col-span-2">
        Title
        <input
          type="text"
          name="title"
          defaultValue={course.title}
          required
          className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900"
        />
      </label>
      <label className="text-xs font-medium text-zinc-700 sm:col-span-2">
        Description
        <textarea
          name="description"
          defaultValue={course.description ?? ""}
          rows={3}
          className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900"
        />
      </label>
      <label className="flex items-center gap-2 text-xs font-medium text-zinc-700 sm:col-span-2">
        <input
          type="checkbox"
          name="isOnboarding"
          defaultChecked={course.isOnboarding}
          className="h-4 w-4 rounded border-zinc-300"
        />
        Use as onboarding course (only course visible to New Hires)
      </label>
      <ThumbnailUploadField
        key={course.thumbnailUrl ?? "no-thumb"}
        label={course.thumbnailUrl ? "Replace thumbnail" : "Thumbnail"}
        currentImageUrl={course.thumbnailUrl}
      />
      <div className="sm:col-span-2">
        <SaveChangesButton formError={formError} showSaved={showSaved} />
      </div>
    </form>
  );
}

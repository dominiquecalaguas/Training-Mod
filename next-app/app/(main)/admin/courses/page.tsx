import Link from "next/link";
import { cookies } from "next/headers";
import { Suspense } from "react";
import { apiUrl } from "@/lib/api";
import { DraggableCourseList } from "./DraggableCourseList";
import { UserManagementTable } from "./UserManagementTable";

export const dynamic = "force-dynamic";

export type CoursePreviewRow = {
  course: { id: number; title: string; order: number };
  lessonCount: number;
};

async function CourseListView() {
  let rows: CoursePreviewRow[];

  try {
    const cookieStore = await cookies();
    const res = await fetch(apiUrl("/api/admin/courses"), {
      cache: "no-store",
      headers: { Cookie: cookieStore.toString() },
    });
    if (!res.ok) {
      const errorBody = (await res.json().catch(() => null)) as
        | { error?: string; hint?: string }
        | null;
      const message = errorBody?.error ?? "Unable to load courses";
      const hint = errorBody?.hint ? ` ${errorBody.hint}` : "";
      throw new Error(`${message}.${hint}`);
    }

    rows = (await res.json()) as CoursePreviewRow[];
  } catch (err) {
    const msg =
      err instanceof Error ? err.message : String(err);
    throw new Error(`Course load error: ${msg}`);
  }

  return (
    <section className="rounded-xl border border-zinc-200 bg-white">
      <div className="border-b border-zinc-200 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
        Existing courses
      </div>
      <DraggableCourseList rows={rows} />
    </section>
  );
}

function CourseListFallback() {
  return (
    <section className="rounded-xl border border-zinc-200 bg-white">
      <div className="border-b border-zinc-200 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
        Existing courses
      </div>
      <div className="px-4 py-8 flex items-center justify-center">
        <p className="text-sm text-zinc-500">Loading courses…</p>
      </div>
    </section>
  );
}

export default async function AdminCoursesPage() {
  return (
    <div className="flex flex-col gap-6">
      <section className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold tracking-tight">Courses</h2>
        <Link
          href="/admin/courses/new"
          className="inline-flex items-center rounded-full bg-zinc-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-zinc-800"
        >
          New course
        </Link>
      </section>
      <Suspense fallback={<CourseListFallback />}>
        <CourseListView />
      </Suspense>
      <section>
        <h2 className="text-lg font-semibold tracking-tight">User Management</h2>
      </section>
      <section className="rounded-xl border border-zinc-200 bg-white">
        <UserManagementTable />
      </section>
    </div>
  );
}

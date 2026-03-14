import Link from "next/link";
import { cookies } from "next/headers";
import { apiUrl } from "@/lib/api";

export const dynamic = "force-dynamic";

type Filter = "all" | "active" | "archived";

interface ByCourseRow {
  courseId: number;
  title: string;
  archived: boolean;
  courseClicks: number;
  lessonClicks: number;
  lessonViews: number;
}

interface ByLessonRow {
  lessonId: number;
  courseId: number;
  lessonTitle: string;
  courseTitle: string;
  archived: boolean;
  lessonClicks: number;
  lessonViews: number;
}

interface AnalyticsResponse {
  ok: boolean;
  message?: string;
  error?: string;
  detail?: string;
  byCourse?: ByCourseRow[];
  byLesson?: ByLessonRow[];
}

async function getAnalytics(filter: Filter): Promise<AnalyticsResponse> {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");
  const url = new URL(apiUrl("/api/dashboard/analytics"));
  if (filter !== "all") url.searchParams.set("filter", filter);
  const res = await fetch(url.toString(), {
    headers: cookieHeader ? { Cookie: cookieHeader } : {},
    cache: "no-store",
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as AnalyticsResponse;
    return {
      ok: false,
      error: body.error ?? `Failed to load: ${res.status}`,
      detail: body.detail,
    };
  }
  return res.json() as Promise<AnalyticsResponse>;
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const { filter: filterParam } = await searchParams;
  const filter: Filter =
    filterParam === "active" || filterParam === "archived"
      ? filterParam
      : "all";
  const data = await getAnalytics(filter);

  if (!data.ok && data.error) {
    return (
      <section className="rounded-xl border border-zinc-200 bg-white p-6">
        <h2 className="text-lg font-semibold tracking-tight">Analytics</h2>
        <p className="mt-2 text-sm text-red-600">{data.error}</p>
        {data.detail ? (
          <pre className="mt-2 max-h-40 overflow-auto rounded bg-zinc-100 p-2 text-xs text-zinc-700">
            {data.detail}
          </pre>
        ) : null}
      </section>
    );
  }

  if (data.message) {
    return (
      <section className="rounded-xl border border-zinc-200 bg-white p-6">
        <h2 className="text-lg font-semibold tracking-tight">Analytics</h2>
        <p className="mt-2 text-sm text-zinc-600">{data.message}</p>
      </section>
    );
  }

  const byCourse = data.byCourse ?? [];
  const byLesson = data.byLesson ?? [];

  const totalCourseClicks = byCourse.reduce((s, r) => s + r.courseClicks, 0);
  const totalLessonClicks = byCourse.reduce((s, r) => s + r.lessonClicks, 0);
  const totalLessonViews = byCourse.reduce((s, r) => s + r.lessonViews, 0);

  return (
    <div className="flex flex-col gap-8">
      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-zinc-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Course clicks
          </p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-zinc-900">
            {totalCourseClicks}
          </p>
          <p className="mt-0.5 text-xs text-zinc-500">Last 30 days</p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Lesson clicks
          </p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-zinc-900">
            {totalLessonClicks}
          </p>
          <p className="mt-0.5 text-xs text-zinc-500">Last 30 days</p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Lesson views
          </p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-zinc-900">
            {totalLessonViews}
          </p>
          <p className="mt-0.5 text-xs text-zinc-500">Last 30 days</p>
        </div>
      </section>
      <p className="text-xs text-zinc-500">
        All metrics above and in the tables below are queried from PostHog (events: course_clicked, lesson_clicked, lesson_viewed).
      </p>
      <nav className="flex gap-2" aria-label="Filter by status">
        {(
          [
            ["all", "All"] as const,
            ["active", "Active only"] as const,
            ["archived", "Archived / deleted only"] as const,
          ] as const
        ).map(([value, label]) => (
          <Link
            key={value}
            href={value === "all" ? "/dashboard" : `/dashboard?filter=${value}`}
            className={`rounded-full px-3 py-1.5 text-sm font-medium ${
              filter === value
                ? "bg-zinc-900 text-white"
                : "bg-zinc-200 text-zinc-700 hover:bg-zinc-300"
            }`}
          >
            {label}
          </Link>
        ))}
      </nav>
      <section className="rounded-xl border border-zinc-200 bg-white">
        <div className="border-b border-zinc-200 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
          By course (last 30 days)
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 text-left">
                <th className="px-4 py-2 font-medium text-zinc-700">Course</th>
                <th className="px-4 py-2 font-medium text-zinc-700">Status</th>
                <th className="px-4 py-2 font-medium text-zinc-700">
                  Course clicks
                </th>
                <th className="px-4 py-2 font-medium text-zinc-700">
                  Lesson clicks
                </th>
                <th className="px-4 py-2 font-medium text-zinc-700">
                  Lesson views
                </th>
              </tr>
            </thead>
            <tbody>
              {byCourse.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-6 text-center text-zinc-500"
                  >
                    No analytics data yet. Configure PostHog and generate some
                    traffic.
                  </td>
                </tr>
              ) : (
                byCourse.map((row) => (
                  <tr
                    key={row.courseId}
                    className="border-b border-zinc-100 last:border-0"
                  >
                    <td className="px-4 py-2 text-zinc-900">{row.title}</td>
                    <td className="px-4 py-2">
                      <span
                        className={
                          row.archived
                            ? "text-amber-600"
                            : "text-zinc-500"
                        }
                      >
                        {row.archived ? "Deleted/archived" : "Active"}
                      </span>
                    </td>
                    <td className="px-4 py-2 tabular-nums text-zinc-700">
                      {row.courseClicks}
                    </td>
                    <td className="px-4 py-2 tabular-nums text-zinc-700">
                      {row.lessonClicks}
                    </td>
                    <td className="px-4 py-2 tabular-nums text-zinc-700">
                      {row.lessonViews}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white">
        <div className="border-b border-zinc-200 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
          By lesson (last 30 days)
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 text-left">
                <th className="px-4 py-2 font-medium text-zinc-700">Lesson</th>
                <th className="px-4 py-2 font-medium text-zinc-700">Course</th>
                <th className="px-4 py-2 font-medium text-zinc-700">Status</th>
                <th className="px-4 py-2 font-medium text-zinc-700">Clicks</th>
                <th className="px-4 py-2 font-medium text-zinc-700">Views</th>
              </tr>
            </thead>
            <tbody>
              {byLesson.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-6 text-center text-zinc-500"
                  >
                    No lesson analytics yet.
                  </td>
                </tr>
              ) : (
                byLesson.map((row) => (
                  <tr
                    key={row.lessonId}
                    className="border-b border-zinc-100 last:border-0"
                  >
                    <td className="px-4 py-2 text-zinc-900">
                      {row.lessonTitle}
                    </td>
                    <td className="px-4 py-2 text-zinc-600">
                      {row.courseTitle}
                    </td>
                    <td className="px-4 py-2">
                      <span
                        className={
                          row.archived
                            ? "text-amber-600"
                            : "text-zinc-500"
                        }
                      >
                        {row.archived ? "Deleted/archived" : "Active"}
                      </span>
                    </td>
                    <td className="px-4 py-2 tabular-nums text-zinc-700">
                      {row.lessonClicks}
                    </td>
                    <td className="px-4 py-2 tabular-nums text-zinc-700">
                      {row.lessonViews}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/db/client";
import { courses, lessons } from "@/db/schema";
import { inArray } from "drizzle-orm";

const ANALYTICS_EVENTS = [
  "course_clicked",
  "lesson_clicked",
  "lesson_viewed",
] as const;

type EventName = (typeof ANALYTICS_EVENTS)[number];

interface RawEvent {
  event: string;
  properties: string | Record<string, unknown>;
  timestamp?: string;
}

interface ParsedEvent {
  event: EventName;
  courseId: number;
  lessonId?: number;
  timestamp: string;
}

function parseEvents(results: RawEvent[]): ParsedEvent[] {
  const out: ParsedEvent[] = [];
  for (const row of results) {
    if (!ANALYTICS_EVENTS.includes(row.event as EventName)) continue;
    const props =
      typeof row.properties === "string"
        ? (JSON.parse(row.properties || "{}") as Record<string, unknown>)
        : row.properties;
    const courseId = Number(props?.courseId);
    if (Number.isNaN(courseId)) continue;
    const lessonId =
      row.event !== "course_clicked"
        ? Number(props?.lessonId)
        : undefined;
    if (row.event !== "course_clicked" && Number.isNaN(Number(props?.lessonId)))
      continue;
    out.push({
      event: row.event as EventName,
      courseId,
      lessonId: lessonId as number | undefined,
      timestamp: row.timestamp ?? new Date().toISOString(),
    });
  }
  return out;
}

export async function GET(request: Request) {
  const cookieStore = await cookies();
  if (cookieStore.get("admin_authed")?.value !== "1") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const filter =
    new URL(request.url).searchParams.get("filter") ?? "all";
  const statusFilter =
    filter === "active"
      ? "active"
      : filter === "archived"
        ? "archived"
        : "all";

  const personalKey = process.env.POSTHOG_PERSONAL_API_KEY?.trim();
  const projectId = process.env.POSTHOG_PROJECT_ID?.trim();
  // Private API (projects/events) uses app host (us.posthog.com), not ingestion host (us.i.posthog.com)
  const appHost =
    process.env.POSTHOG_APP_HOST ??
    (() => {
      const ingestion =
        process.env.POSTHOG_HOST ??
        process.env.NEXT_PUBLIC_POSTHOG_HOST ??
        "https://us.i.posthog.com";
      return ingestion.replace(".i.posthog.com", ".posthog.com");
    })();

  if (!personalKey || !projectId) {
    return NextResponse.json({
      ok: true,
      message: "PostHog not configured (missing POSTHOG_PERSONAL_API_KEY or POSTHOG_PROJECT_ID)",
      byCourse: [],
      byLesson: [],
      courseResolve: {},
      lessonResolve: {},
    });
  }

  try {
    // Use Query API (HogQL) instead of deprecated GET /api/projects/.../events/
    const queryUrl = `${appHost.replace(/\/$/, "")}/api/projects/${encodeURIComponent(projectId)}/query/`;
    const res = await fetch(queryUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${personalKey}`,
      },
      body: JSON.stringify({
        query: {
          kind: "HogQLQuery",
          query: `SELECT event, properties, timestamp FROM events WHERE event IN ('course_clicked', 'lesson_clicked', 'lesson_viewed') AND timestamp >= now() - INTERVAL 30 DAY ORDER BY timestamp DESC LIMIT 1000`,
        },
        name: "dashboard-analytics",
      }),
      next: { revalidate: 60 },
    });

    const responseText = await res.text();
    if (!res.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: `PostHog API error: ${res.status}`,
          detail: responseText.slice(0, 800),
        },
        { status: 502 },
      );
    }

    let data: { results?: unknown[]; columns?: string[] };
    try {
      data = JSON.parse(responseText) as {
        results?: unknown[];
        columns?: string[];
      };
    } catch {
      return NextResponse.json(
        {
          ok: false,
          error: "PostHog returned invalid JSON",
          detail: responseText.slice(0, 500),
        },
        { status: 502 },
      );
    }

    const columns = data.columns ?? ["event", "properties", "timestamp"];
    const results = data.results ?? [];
    const rawEvents: RawEvent[] = results.map((row) => {
      if (Array.isArray(row)) {
        const eventIdx = columns.indexOf("event");
        const propsIdx = columns.indexOf("properties");
        const tsIdx = columns.indexOf("timestamp");
        return {
          event: (eventIdx >= 0 ? row[eventIdx] : undefined) as string,
          properties:
            propsIdx >= 0 ? row[propsIdx] : ({} as Record<string, unknown>),
          timestamp: tsIdx >= 0 ? (row[tsIdx] as string) : undefined,
        };
      }
      return row as RawEvent;
    });
    const events = parseEvents(rawEvents);

    const courseIds = [...new Set(events.map((e) => e.courseId))];
    const lessonIds = [
      ...new Set(
        events.map((e) => e.lessonId).filter((id): id is number => id != null),
      ),
    ];

    const courseRows =
      courseIds.length > 0
        ? await db
            .select({
              id: courses.id,
              title: courses.title,
              archivedAt: courses.archivedAt,
            })
            .from(courses)
            .where(inArray(courses.id, courseIds))
        : [];
    const lessonRows =
      lessonIds.length > 0
        ? await db
            .select({
              id: lessons.id,
              courseId: lessons.courseId,
              title: lessons.title,
              archivedAt: lessons.archivedAt,
            })
            .from(lessons)
            .where(inArray(lessons.id, lessonIds))
        : [];

    const courseResolve: Record<
      number,
      { title: string; archived: boolean }
    > = Object.fromEntries(
      courseRows.map((r) => [
        r.id,
        { title: r.title, archived: r.archivedAt != null },
      ]),
    );
    const lessonResolve: Record<
      number,
      { courseId: number; title: string; archived: boolean }
    > = Object.fromEntries(
      lessonRows.map((r) => [
        r.id,
        {
          courseId: r.courseId,
          title: r.title,
          archived: r.archivedAt != null,
        },
      ]),
    );

    const courseClicks: Record<number, number> = {};
    const lessonClicks: Record<number, number> = {};
    const lessonViews: Record<number, number> = {};

    for (const e of events) {
      if (e.event === "course_clicked") {
        courseClicks[e.courseId] = (courseClicks[e.courseId] ?? 0) + 1;
      } else if (e.event === "lesson_clicked" && e.lessonId != null) {
        lessonClicks[e.lessonId] = (lessonClicks[e.lessonId] ?? 0) + 1;
      } else if (e.event === "lesson_viewed" && e.lessonId != null) {
        lessonViews[e.lessonId] = (lessonViews[e.lessonId] ?? 0) + 1;
      }
    }

    let byCourse = courseIds.map((id) => ({
      courseId: id,
      title: courseResolve[id]?.title ?? `Course #${id} (deleted)`,
      archived: courseResolve[id]?.archived ?? true,
      courseClicks: courseClicks[id] ?? 0,
      lessonClicks: lessonRows
        .filter((l) => l.courseId === id)
        .reduce((sum, l) => sum + (lessonClicks[l.id] ?? 0), 0),
      lessonViews: lessonRows
        .filter((l) => l.courseId === id)
        .reduce((sum, l) => sum + (lessonViews[l.id] ?? 0), 0),
    }));

    let byLesson = lessonIds.map((id) => {
      const meta = lessonResolve[id];
      return {
        lessonId: id,
        courseId: meta?.courseId ?? 0,
        lessonTitle: meta?.title ?? `Lesson #${id} (deleted)`,
        courseTitle:
          meta != null
            ? courseResolve[meta.courseId]?.title ?? `Course #${meta.courseId} (deleted)`
            : "—",
        archived: meta?.archived ?? true,
        lessonClicks: lessonClicks[id] ?? 0,
        lessonViews: lessonViews[id] ?? 0,
      };
    });

    if (statusFilter === "active") {
      byCourse = byCourse.filter((r) => !r.archived);
      byLesson = byLesson.filter((r) => !r.archived);
    } else if (statusFilter === "archived") {
      byCourse = byCourse.filter((r) => r.archived);
      byLesson = byLesson.filter((r) => r.archived);
    }

    return NextResponse.json({
      ok: true,
      filter: statusFilter,
      byCourse,
      byLesson,
      courseResolve,
      lessonResolve,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { ok: false, error: message },
      { status: 500 },
    );
  }
}

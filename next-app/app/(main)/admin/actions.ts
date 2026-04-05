"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq, ne, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { courses, lessons } from "@/db/schema";
import { apiUrl } from "@/lib/api";

/** Raw file size limit before base64 (server action body limit is 10mb in next.config). */
const MAX_THUMBNAIL_BYTES = 6 * 1024 * 1024;

function mimeForThumbnail(file: File): string {
  const t = (file.type ?? "").toLowerCase();
  if (/^image\/(jpeg|pjpeg|png|gif|webp)$/i.test(t)) {
    return t === "image/pjpeg" ? "image/jpeg" : t;
  }
  return "image/jpeg";
}

/** Store thumbnail as a data URL in `courses.thumbnail_url` (no blob or disk). */
async function encodeThumbnailToDataUrl(file: File): Promise<string | null> {
  if (file.size === 0 || file.size > MAX_THUMBNAIL_BYTES) return null;
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const mime = mimeForThumbnail(file);
  return `data:${mime};base64,${buffer.toString("base64")}`;
}

function thumbnailFromFormData(formData: FormData): File | null {
  const v = formData.get("thumbnail");
  if (v == null || typeof v === "string") return null;
  if (v instanceof File && v.size > 0) return v;
  return null;
}

type LessonInput = { title: string; order: number };

function parseLessonsFromFormData(formData: FormData): LessonInput[] {
  const raw = formData.get("lessons");
  if (raw === null || raw === undefined || String(raw).trim() === "") return [];
  try {
    const parsed = JSON.parse(String(raw)) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (item): item is LessonInput =>
          item != null &&
          typeof item === "object" &&
          "title" in item &&
          "order" in item,
      )
      .map((item) => ({
        title: String(item.title ?? "").trim() || "Untitled lesson",
        order: Number(item.order) || 0,
      }))
      .sort((a, b) => a.order - b.order)
      .map((item, i) => ({ ...item, order: i + 1 }));
  } catch {
    return [];
  }
}

const DESCRIPTION_MAX_LENGTH = 160;
async function requestJson(
  path: string,
  options: { method: string; body?: unknown },
) {
  return fetch(apiUrl(path), {
    method: options.method,
    headers: {
      "Content-Type": "application/json",
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
}

export async function createCourse(formData: FormData) {
  const title = String(formData.get("title") || "").trim();
  let description = String(formData.get("description") || "").trim();
  description = description.slice(0, DESCRIPTION_MAX_LENGTH);
  const thumbnailFile = thumbnailFromFormData(formData);

  if (!title) return;

  let thumbnailUrl: string | null = null;
  if (thumbnailFile) {
    thumbnailUrl = await encodeThumbnailToDataUrl(thumbnailFile);
  }

  const [{ maxOrder }] = await db
    .select({ maxOrder: sql<number>`coalesce(max(${courses.order}), 0)` })
    .from(courses);
  const order = Number(maxOrder) + 1;

  const [inserted] = await db
    .insert(courses)
    .values({
      title,
      description: description || null,
      thumbnailUrl,
      order,
    })
    .returning({ id: courses.id });

  if (!inserted) {
    revalidatePath("/admin/courses");
    revalidatePath("/");
    redirect("/admin/courses");
    return;
  }

  const newCourseId = inserted.id;
  const lessonInputs = parseLessonsFromFormData(formData);

  if (lessonInputs.length > 0) {
    await db.insert(lessons).values(
      lessonInputs.map((l) => ({
        courseId: newCourseId,
        title: l.title,
        content: "",
        order: l.order,
      })),
    );
  }

  revalidatePath("/admin/courses");
  revalidatePath("/");
  revalidatePath(`/admin/courses/${newCourseId}/lessons`);
  revalidatePath(`/courses/${newCourseId}`);
  redirect(`/admin/courses/${newCourseId}/lessons?created=1`);
}

export type UpdateCourseState =
  | { ok: true }
  | { ok: false; error: string };

export async function updateCourse(
  _prev: UpdateCourseState | null,
  formData: FormData,
): Promise<UpdateCourseState> {
  try {
    const id = Number(formData.get("id") || "0");
    const title = String(formData.get("title") || "").trim();
    let description = String(formData.get("description") || "").trim();
    description = description.slice(0, DESCRIPTION_MAX_LENGTH);
    const thumbnailFile = thumbnailFromFormData(formData);

    if (!id || !title) {
      return { ok: false, error: "Course title is required." };
    }

    const removeThumbnail = formData.get("removeThumbnail");
    let thumbnailUrl: string | null | undefined = undefined;
    if (removeThumbnail) {
      thumbnailUrl = null;
    } else if (thumbnailFile) {
      const dataUrl = await encodeThumbnailToDataUrl(thumbnailFile);
      if (dataUrl === null) {
        return {
          ok: false,
          error: `Could not store thumbnail. Use an image under ${MAX_THUMBNAIL_BYTES / (1024 * 1024)}MB.`,
        };
      }
      thumbnailUrl = dataUrl;
    }
    if (thumbnailUrl === undefined) {
      const [current] = await db
        .select({ thumbnailUrl: courses.thumbnailUrl })
        .from(courses)
        .where(eq(courses.id, id))
        .limit(1);
      thumbnailUrl = current?.thumbnailUrl ?? null;
    }

    const isOnboarding = formData.get("isOnboarding") === "on";

    if (isOnboarding) {
      await db.update(courses).set({ isOnboarding: false }).where(ne(courses.id, id));
    }

    await db
      .update(courses)
      .set({
        title,
        description: description || null,
        thumbnailUrl: thumbnailUrl ?? null,
        isOnboarding,
        updatedAt: new Date(),
      })
      .where(eq(courses.id, id));

    revalidatePath("/admin/courses");
    revalidatePath(`/admin/courses/${id}/edit`);
    revalidatePath("/");

    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Something went wrong.";
    return { ok: false, error: message };
  }
}

export async function deleteCourse(formData: FormData) {
  const id = Number(formData.get("id") || "0");
  if (!id) return;

  const res = await requestJson(`/api/admin/courses/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) return;

  revalidatePath("/admin/courses");
  revalidatePath("/");
}

export async function setCoursesOrder(formData: FormData) {
  const ids = formData.getAll("ids");
  if (!Array.isArray(ids) || ids.length === 0) return;

  const numericIds = ids
    .map((id) => Number(id))
    .filter((id) => Number.isInteger(id) && id > 0);

  for (let i = 0; i < numericIds.length; i++) {
    await db
      .update(courses)
      .set({ order: i + 1 })
      .where(eq(courses.id, numericIds[i]));
  }

  revalidatePath("/admin/courses");
  revalidatePath("/");
}

export async function setLessonsOrder(formData: FormData) {
  const courseId = Number(formData.get("courseId") || "0");
  const ids = formData.getAll("ids");
  if (!courseId || !Array.isArray(ids) || ids.length === 0) return;

  const numericIds = ids
    .map((id) => Number(id))
    .filter((id) => Number.isInteger(id) && id > 0);

  for (let i = 0; i < numericIds.length; i++) {
    await db
      .update(lessons)
      .set({ order: i + 1 })
      .where(
        and(eq(lessons.id, numericIds[i]), eq(lessons.courseId, courseId)),
      );
  }

  revalidatePath(`/admin/courses/${courseId}/lessons`);
  revalidatePath(`/admin/courses/${courseId}/edit`);
  revalidatePath(`/courses/${courseId}`);
}

export async function createLesson(formData: FormData) {
  const courseId = Number(formData.get("courseId") || "0");
  const title = String(formData.get("title") || "");
  const content = String(formData.get("content") || "");
  const order = Number(formData.get("order") || "0");

  if (!courseId || !title) return;

  const res = await requestJson(`/api/admin/courses/${courseId}/lessons`, {
    method: "POST",
    body: {
      title,
      content,
      order,
    },
  });
  if (!res.ok) return;

  revalidatePath(`/admin/courses/${courseId}/lessons`);
  revalidatePath(`/admin/courses/${courseId}/edit`);
  revalidatePath(`/courses/${courseId}`);
  revalidatePath("/admin/courses");
  revalidatePath("/");
}

export async function updateLesson(formData: FormData) {
  const id = Number(formData.get("id") || "0");
  const courseId = Number(formData.get("courseId") || "0");
  const title = String(formData.get("title") || "");
  const content = String(formData.get("content") || "");
  const order = Number(formData.get("order") || "0");

  if (!id || !courseId || !title) return;

  await db
    .update(lessons)
    .set({
      title,
      content,
      order,
      updatedAt: new Date(),
    })
    .where(eq(lessons.id, id));

  revalidatePath(`/admin/courses/${courseId}/lessons`);
  revalidatePath(`/admin/courses/${courseId}/edit`);
  revalidatePath(`/courses/${courseId}`);
  revalidatePath("/admin/courses");
  revalidatePath("/");
}

export async function deleteLesson(formData: FormData) {
  const id = Number(formData.get("id") || "0");
  const courseId = Number(formData.get("courseId") || "0");
  if (!id || !courseId) return;

  const res = await requestJson(
    `/api/admin/courses/${courseId}/lessons/${id}`,
    {
      method: "DELETE",
    },
  );
  if (!res.ok) return;

  revalidatePath(`/admin/courses/${courseId}/lessons`);
  revalidatePath(`/admin/courses/${courseId}/edit`);
  revalidatePath(`/courses/${courseId}`);
  revalidatePath("/admin/courses");
  revalidatePath("/");
}

export async function reorderLesson(formData: FormData) {
  const id = Number(formData.get("id") || "0");
  const courseId = Number(formData.get("courseId") || "0");
  const direction = String(formData.get("direction") || "");
  if (!id || !courseId || (direction !== "up" && direction !== "down")) return;

  const res = await requestJson(
    `/api/admin/courses/${courseId}/lessons/${id}/reorder`,
    {
      method: "POST",
      body: { direction },
    },
  );
  if (!res.ok) return;

  revalidatePath(`/admin/courses/${courseId}/lessons`);
  revalidatePath(`/courses/${courseId}`);
}

export async function seedCheckInProceduresCourse() {
  const res = await requestJson(
    "/api/admin/courses/seed-check-in-procedures",
    {
      method: "POST",
    },
  );
  if (!res.ok) return;

  const data = (await res.json().catch(() => null)) as
    | { courseId?: number }
    | null;
  const courseId =
    data && typeof data.courseId === "number" ? data.courseId : null;

  revalidatePath("/admin/courses");
  revalidatePath("/");
  if (courseId) {
    revalidatePath(`/admin/courses/${courseId}/lessons`);
    revalidatePath(`/courses/${courseId}`);
    redirect(`/admin/courses/${courseId}/lessons`);
  }
}

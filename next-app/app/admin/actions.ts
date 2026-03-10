"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { courses, lessons } from "@/db/schema";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

async function saveThumbnailFile(file: File): Promise<string | null> {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const ext = path.extname(file.name) || ".jpg";
  const safeExt = /^\.(jpe?g|png|gif|webp)$/i.test(ext) ? ext : ".jpg";
  const filename = `course-${Date.now()}-${Math.random().toString(36).slice(2, 9)}${safeExt}`;
  const dir = path.join(process.cwd(), "public", "course-thumbnails");
  await mkdir(dir, { recursive: true });
  const filepath = path.join(dir, filename);
  await writeFile(filepath, buffer);
  return `/course-thumbnails/${filename}`;
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
  url: string,
  options: { method: string; body?: unknown },
) {
  return fetch(url, {
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
  const thumbnailFile = formData.get("thumbnail") as File | null;

  if (!title) return;

  let thumbnailUrl: string | null = null;
  if (thumbnailFile && thumbnailFile.size > 0) {
    thumbnailUrl = await saveThumbnailFile(thumbnailFile);
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

export async function updateCourse(formData: FormData) {
  const id = Number(formData.get("id") || "0");
  const title = String(formData.get("title") || "");
  const description = String(formData.get("description") || "");
  const thumbnailFile = formData.get("thumbnail") as File | null;

  if (!id || !title) return;

  const removeThumbnail = formData.get("removeThumbnail");
  let thumbnailUrl: string | null | undefined = undefined;
  if (removeThumbnail) {
    thumbnailUrl = null;
  } else if (thumbnailFile && thumbnailFile.size > 0) {
    thumbnailUrl = await saveThumbnailFile(thumbnailFile);
  } else {
    const [current] = await db
      .select({ thumbnailUrl: courses.thumbnailUrl })
      .from(courses)
      .where(eq(courses.id, id))
      .limit(1);
    thumbnailUrl = current?.thumbnailUrl ?? null;
  }

  await db
    .update(courses)
    .set({
      title,
      description: description || null,
      thumbnailUrl: thumbnailUrl ?? null,
    })
    .where(eq(courses.id, id));

  revalidatePath("/admin/courses");
  revalidatePath(`/admin/courses/${id}/edit`);
  revalidatePath("/");
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

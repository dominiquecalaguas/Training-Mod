import { NextRequest, NextResponse } from "next/server";
import { markLessonComplete, unmarkLessonComplete } from "@//lib/progress";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const { deviceToken, courseId, lessonId } = body as {
    deviceToken?: string;
    courseId?: number;
    lessonId?: number;
  };

  if (!deviceToken || !courseId || !lessonId) {
    return NextResponse.json(
      { error: "Missing deviceToken, courseId, or lessonId" },
      { status: 400 },
    );
  }

  await markLessonComplete({
    deviceToken,
    courseId,
    lessonId,
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const { deviceToken, lessonId } = body as {
    deviceToken?: string;
    lessonId?: number;
  };

  if (!deviceToken || !lessonId) {
    return NextResponse.json(
      { error: "Missing deviceToken or lessonId" },
      { status: 400 },
    );
  }

  await unmarkLessonComplete({ deviceToken, lessonId });

  return NextResponse.json({ ok: true });
}


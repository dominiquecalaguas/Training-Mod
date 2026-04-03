import { NextRequest, NextResponse } from "next/server";
import { getCourseProgressForDevice } from "@//lib/progress";

export async function GET(req: NextRequest) {
  const deviceToken = req.nextUrl.searchParams.get("deviceToken");
  if (!deviceToken) {
    return NextResponse.json({ error: "Missing deviceToken" }, { status: 400 });
  }

  try {
    const data = await getCourseProgressForDevice(deviceToken);
    return NextResponse.json(data);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    console.error("[api/progress/courses]", message);
    return NextResponse.json(
      { error: "Failed to load progress" },
      { status: 500 },
    );
  }
}


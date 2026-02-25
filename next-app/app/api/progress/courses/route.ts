import { NextRequest, NextResponse } from "next/server";
import { getCourseProgressForDevice } from "@/src/lib/progress";

export async function GET(req: NextRequest) {
  const deviceToken = req.nextUrl.searchParams.get("deviceToken");
  if (!deviceToken) {
    return NextResponse.json({ error: "Missing deviceToken" }, { status: 400 });
  }

  const data = await getCourseProgressForDevice(deviceToken);
  return NextResponse.json(data);
}


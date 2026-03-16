import { NextResponse } from "next/server";
import { getPageSession } from "@/auth/lucia";
import { getCoursesList } from "@/lib/courses";

export async function GET() {
  try {
    const { user } = await getPageSession();
    const rows = await getCoursesList(user);
    return NextResponse.json(rows);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

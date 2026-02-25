import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) {
    return NextResponse.json(
      { error: "ADMIN_PASSWORD is not configured" },
      { status: 500 },
    );
  }

  const body = await req.json().catch(() => null);
  if (!body || typeof body.password !== "string") {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  if (body.password !== adminPassword) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({ ok: true });
}


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

  const submitted = body.password.trim();
  const expected = adminPassword.trim();
  if (submitted !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set("admin_authed", "1", {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
  return res;
}


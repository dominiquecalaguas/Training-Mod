import { lucia, getPageSession } from "@/auth/lucia";
import { NextResponse } from "next/server";

export async function POST() {
  const { session } = await getPageSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  await lucia.invalidateSession(session.id);

  const sessionCookie = lucia.createBlankSessionCookie();
  const res = NextResponse.json({ ok: true });
  res.cookies.set(sessionCookie.name, sessionCookie.value, {
    ...sessionCookie.attributes,
    path: "/",
    maxAge: 0,
  });
  return res;
}

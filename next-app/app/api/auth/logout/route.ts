import { lucia, getPageSession } from "@/auth/lucia";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST() {
  const { session } = await getPageSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  await lucia.invalidateSession(session.id);
  const sessionCookie = lucia.createBlankSessionCookie();
  (await cookies()).set(
    sessionCookie.name,
    sessionCookie.value,
    sessionCookie.attributes,
  );
  return NextResponse.json({ ok: true });
}

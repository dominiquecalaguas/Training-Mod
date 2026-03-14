"use client";

import { useRouter } from "next/navigation";
import posthog from "posthog-js";

export function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    posthog.capture("user_signed_out");
    posthog.reset();
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      className="rounded-md px-3 py-2 text-sm font-medium text-neutral-400 transition hover:bg-neutral-800/60 hover:text-neutral-100"
    >
      Log out
    </button>
  );
}

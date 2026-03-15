"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import posthog from "posthog-js";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export function UserNavDropdown({ displayName }: { displayName: string }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  async function handleLogout() {
    setOpen(false);
    posthog.capture("user_signed_out");
    posthog.reset();
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        className="rounded-md px-3 py-2 text-sm font-medium text-neutral-400 transition hover:bg-neutral-800/60 hover:text-neutral-100 data-[state=open]:bg-neutral-800/60 data-[state=open]:text-neutral-100"
        aria-label="User menu"
      >
        {displayName}
      </PopoverTrigger>
      <PopoverContent align="end" className="w-48 p-2">
        <div className="flex flex-col gap-0.5">
          <Link
            href="/profile"
            onClick={() => setOpen(false)}
            className="rounded-md px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
          >
            View profile
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-md px-3 py-2 text-left text-sm font-medium text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
          >
            Log out
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

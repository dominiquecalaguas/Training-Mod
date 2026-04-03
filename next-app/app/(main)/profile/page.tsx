import { getPageSession } from "@/auth/lucia";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const { user } = await getPageSession();
  if (!user) {
    redirect("/login");
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
        Your profile
      </h1>
      <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
        Personal dashboard — coming soon.
      </p>
    </main>
  );
}

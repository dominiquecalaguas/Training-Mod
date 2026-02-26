import { db } from "@/src/db/client";
import { courses } from "@/src/db/schema";
import { CourseGrid } from "@/src/components/CourseGrid";
import { DeviceTokenProvider } from "@/src/components/DeviceTokenProvider";

export default async function Home() {
  let allCourses: (typeof courses.$inferSelect)[] = [];
  let loadError = false;

  try {
    allCourses = await db
      .select()
      .from(courses)
      .orderBy(courses.order);
  } catch {
    loadError = true;
  }

  return (
    <DeviceTokenProvider>
      <main className="min-h-screen bg-neutral-950 py-10 px-4 text-zinc-50">
        <div className="mx-auto flex max-w-6xl flex-col gap-8">
          <header className="flex flex-col gap-4">
            <div className="space-y-2">
              <span className="inline-flex items-center rounded-full bg-neutral-900 px-3 py-1 text-xs font-medium uppercase tracking-wide text-neutral-400 ring-1 ring-neutral-800">
                Classroom
              </span>
              <div>
                <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                  Training Library
                </h1>
                <p className="mt-1 max-w-xl text-sm text-neutral-400">
                  Work through structured courses, keep your progress on this
                  device, and build your skills one lesson at a time.
                </p>
              </div>
            </div>
          </header>
          {loadError && (
            <p className="rounded-xl border border-red-500/30 bg-red-500/5 px-4 py-3 text-sm text-red-300">
              Unable to load courses right now. Please try again shortly.
            </p>
          )}
          <CourseGrid courses={allCourses} />
        </div>
      </main>
    </DeviceTokenProvider>
  );
}

import { courses } from "@/db/schema";
import { CourseGrid } from "@//components/CourseGrid";
import { DeviceTokenProvider } from "@//components/DeviceTokenProvider";
import { apiUrl } from "@/lib/api";

export default async function Home() {
  let allCourses: Array<typeof courses.$inferSelect> = [];
  const lessonCountByCourseId: Record<number, number> = {};
  let loadError = false;

  try {
    const res = await fetch(apiUrl("/api/courses"), { cache: "no-store" });
    if (!res.ok) {
      loadError = true;
    } else {
      allCourses = (await res.json()) as Array<typeof courses.$inferSelect>;
    }
  } catch {
    loadError = true;
  }

  return (
    <DeviceTokenProvider>
      <main className="min-h-screen bg-neutral-50 py-10 px-4 text-neutral-900">
        <div className="mx-auto flex max-w-6xl flex-col gap-8">
          <header className="flex flex-col gap-4">
            <div className="space-y-2">
              <span className="inline-flex items-center rounded-full bg-neutral-200 px-3 py-1 text-xs font-medium uppercase tracking-wide text-neutral-600 ring-1 ring-neutral-300">
                Classroom
              </span>
              <div>
                <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl text-neutral-900">
                  Training Library
                </h1>
                <p className="mt-1 max-w-xl text-sm text-neutral-600">
                  Work through structured courses, keep your progress on this
                  device, and build your skills one lesson at a time.
                </p>
              </div>
            </div>
          </header>
          {loadError && (
            <p className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
              Unable to load courses right now. Please try again shortly.
            </p>
          )}
          <CourseGrid
            courses={allCourses}
            lessonCountByCourseId={lessonCountByCourseId}
          />
        </div>
      </main>
    </DeviceTokenProvider>
  );
}

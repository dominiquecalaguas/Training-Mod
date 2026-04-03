import { Mail } from "lucide-react";
import { getPageSession } from "@/auth/lucia";
import { BrandMark } from "@/components/BrandMark";
import { CourseGrid } from "@//components/CourseGrid";
import { DeviceTokenProvider } from "@//components/DeviceTokenProvider";
import { getCoursesList, type CourseListItem } from "@/lib/courses";

export default async function Home() {
  const { user } = await getPageSession();
  let allCourses: CourseListItem[] = [];
  const lessonCountByCourseId: Record<number, number> = {};
  let loadError = false;

  try {
    allCourses = await getCoursesList(user);
  } catch {
    loadError = true;
  }

  const greetingName =
    user?.firstName ??
    (user?.displayName ? user.displayName.split(/\s+/)[0] : null);

  return (
    <DeviceTokenProvider>
      <main className="min-h-screen bg-neutral-50 px-4 pb-12 pt-6 text-neutral-900 md:px-8 md:pt-10">
        <div className="mx-auto flex max-w-6xl flex-col gap-8">
          <header className="flex items-start justify-between gap-4">
            <h1 className="text-3xl font-semibold tracking-tight text-neutral-900 sm:text-4xl">
              {greetingName ? (
                `Welcome back, ${greetingName}`
              ) : (
                <BrandMark variant="onLight" className="max-h-8 max-w-[11rem] sm:max-h-10 sm:max-w-[13rem]" />
              )}
            </h1>
            <button
              type="button"
              className="shrink-0 rounded-md p-2 text-neutral-800 hover:bg-neutral-200/80"
              aria-label="Notifications"
              disabled
            >
              <Mail className="h-6 w-6" strokeWidth={1.75} />
            </button>
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

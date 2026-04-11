import { Mail } from "lucide-react";
import { getPageSession } from "@/auth/lucia";
import { BrandMark } from "@/components/BrandMark";
import { CoursesPage } from "@/components/CoursesPage";
import { HomeSearchBar } from "@/components/HomeSearchBar";
import { DeviceTokenProvider } from "@/components/DeviceTokenProvider";
import {
  getCoursesWithLessonsForSearch,
  type CourseWithLessonsForSearch,
} from "@/lib/courses";

export default async function Home() {
  const { user } = await getPageSession();
  let allCourses: CourseWithLessonsForSearch[] = [];
  let lessonCountByCourseId: Record<number, number> = {};
  let loadError = false;

  try {
    allCourses = await getCoursesWithLessonsForSearch(user);
    lessonCountByCourseId = Object.fromEntries(
      allCourses.map((c) => [c.id, c.lessons.length]),
    );
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
          <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between lg:gap-6">
            <h1 className="shrink-0 text-3xl font-semibold tracking-tight text-neutral-900 sm:text-4xl">
              {greetingName ? (
                `Welcome back, ${greetingName}`
              ) : (
                <BrandMark variant="onLight" className="max-h-8 max-w-[11rem] sm:max-h-10 sm:max-w-[13rem]" />
              )}
            </h1>
            <div className="flex min-w-0 flex-1 flex-wrap items-center justify-end gap-3 sm:gap-4">
              <HomeSearchBar />
              <button
                type="button"
                className="shrink-0 rounded-md p-2 text-neutral-800 hover:bg-neutral-200/80"
                aria-label="Notifications"
                disabled
              >
                <Mail className="h-6 w-6" strokeWidth={1.75} />
              </button>
            </div>
          </header>
          {loadError && (
            <p className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
              Unable to load courses right now. Please try again shortly.
            </p>
          )}
          <CoursesPage
            courses={allCourses}
            lessonCountByCourseId={lessonCountByCourseId}
          />
        </div>
      </main>
    </DeviceTokenProvider>
  );
}

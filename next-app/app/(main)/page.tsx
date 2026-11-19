import { getPageSession } from "@/auth/lucia";
import { CoursesPage } from "@/components/CoursesPage";
import { DeviceTokenProvider } from "@/components/DeviceTokenProvider";
import { HomeSearchBar } from "@/components/HomeSearchBar";
import { LibraryUpdates } from "@/components/LibraryUpdates";
import { getCourseLibrary } from "@/lib/courses";
import styles from "@/components/course-library.module.css";

export default async function Home() {
  const { user } = await getPageSession();
  let library: Awaited<ReturnType<typeof getCourseLibrary>> | undefined;

  try {
    library = await getCourseLibrary(user);
  } catch {
    // Keep the shell and search available when the library cannot be loaded.
  }

  const lessonCountByCourseId = Object.fromEntries(
    (library?.courses ?? []).map((course) => [course.id, course.lessons.length]),
  );
  const greetingName =
    user?.firstName?.trim() || user?.displayName?.trim().split(/\s+/)[0];

  return (
    <DeviceTokenProvider>
      <main className={`${styles.library} ${styles.nightSurface}`}>
        <div className={styles.sky} aria-hidden="true">
          <span />
          <span />
          <span />
          <span />
          <span />
          <div className={styles.shootingStars}>
            <i />
            <i />
            <i />
            <i />
          </div>
        </div>
        <div className={styles.layout}>
          <header className={styles.hero}>
            <h1>{greetingName ? `Welcome back, ${greetingName}` : "Welcome to Prisma"}</h1>
            <p className={styles.intro}>Browse your training or look up a clinic procedure.</p>
            <HomeSearchBar />
          </header>

          <section className={styles.courses} aria-labelledby="library-courses">
            <h2 id="library-courses" className={styles.sectionTitle}>Courses</h2>
            {library ? (
              <CoursesPage
                courses={library.courses}
                lessonCountByCourseId={lessonCountByCourseId}
              />
            ) : (
              <p role="alert" className={styles.error}>
                Unable to load courses right now. Please try again shortly.
              </p>
            )}
          </section>

          <LibraryUpdates
            lessonUpdates={library?.recentLessonUpdates ?? []}
            loadError={!library}
          />
        </div>
      </main>
    </DeviceTokenProvider>
  );
}

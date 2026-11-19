import Link from "next/link";
import { ArrowUpRight, Bell, BookOpen } from "lucide-react";
import { StarJar } from "@/components/StarJar";
import type { LessonUpdate } from "@/lib/courses";
import styles from "@/components/course-library.module.css";

// Replace these examples when announcements and rewards have real data sources.
const announcementDemo: { title: string; description: string; date?: string } = {
  title: "New-hire training",
  description: "A clinic reminder could highlight which courses to review before a first shift.",
};
const starJarDemo = { earned: 6, goal: 10 };

const updateDate = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

export function LibraryUpdates({
  lessonUpdates,
  loadError,
}: {
  lessonUpdates: LessonUpdate[];
  loadError: boolean;
}) {
  return (
    <aside className={styles.updates} aria-label="Clinic and learning updates">
      <section className={styles.panel} aria-labelledby="library-announcements">
        <h2 id="library-announcements" className={styles.panelHeading}>
          <Bell size={16} aria-hidden="true" />
          Announcements
        </h2>
        <div className={styles.announcement}>
          <p className={styles.demo}>Example announcement</p>
          <p className={styles.updateTitle}>{announcementDemo.title}</p>
          <p className={styles.panelCopy}>{announcementDemo.description}</p>
          {announcementDemo.date && (
            <time className={styles.updateDate} dateTime={announcementDemo.date}>
              {updateDate.format(new Date(announcementDemo.date))}
            </time>
          )}
        </div>
      </section>

      <section className={styles.panel} aria-labelledby="library-lesson-updates">
        <h2 id="library-lesson-updates" className={styles.panelHeading}>
          <BookOpen size={16} aria-hidden="true" />
          Lesson Updates
        </h2>
        {lessonUpdates.length ? (
          <ul className={styles.lessonUpdates}>
            {lessonUpdates.map((lesson) => (
              <li key={lesson.lessonId}>
                <Link
                  href={`/courses/${lesson.courseId}/lessons/${lesson.lessonId}`}
                  prefetch={false}
                >
                  <span className={styles.updateTitle}>{lesson.lessonTitle}</span>
                  <span className={styles.panelCopy}>{lesson.courseTitle}</span>
                  <span className={styles.updateDate}>
                    {lesson.kind}{" "}
                    <time dateTime={lesson.date}>{updateDate.format(new Date(lesson.date))}</time>
                  </span>
                  <ArrowUpRight size={15} aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className={styles.panelCopy}>
            {loadError ? "Lesson updates are unavailable right now." : "No lesson updates yet."}
          </p>
        )}
      </section>

      <StarJar {...starJarDemo} />
    </aside>
  );
}

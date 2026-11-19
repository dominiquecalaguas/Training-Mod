import { ChevronDown, Sparkles } from "lucide-react";
import styles from "./course-library.module.css";

export function StarJar({ earned, goal }: { earned: number; goal: number }) {
  return (
    <details className={styles.starJar}>
      <summary>
        <span className={styles.jarArt} aria-hidden="true">
          <span className={styles.jarLid} />
          <span className={styles.jarGlass}>
            <span>✦</span><span>✦</span><span>✦</span><span>✦</span><span>✦</span>
          </span>
        </span>
        <span className={styles.jarInfo}>
          <span className={styles.demo}>Demo</span>
          <span className={styles.jarTitle}>Star Jar</span>
          <span className={styles.jarCount}>{earned} / {goal} stars</span>
          <progress value={earned} max={goal} aria-label="Demo stars collected" />
        </span>
        <ChevronDown className={styles.jarChevron} size={16} aria-hidden="true" />
      </summary>
      <div className={styles.reward}>
        <Sparkles size={19} aria-hidden="true" />
        <p>
          In a future version, scoring 100% on a lesson quiz will earn a star.
          Fill the jar to unlock Eevee. Master all required courses to choose an evolution.
        </p>
      </div>
    </details>
  );
}

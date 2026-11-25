"use client";

import { usePathname } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import morningStyles from "../../app/(main)/courses/[courseId]/lessons/[lessonId]/morning-sky.module.css";
import styles from "./prisma-sky-transition.module.css";

const TRANSITION_DURATION = 1200;

const SkyTransition = createContext<{
  startedAt: number | null;
  start: () => void;
  finish: () => void;
} | null>(null);

export function useSkyTransition() {
  return useContext(SkyTransition);
}

export function PrismaSkyTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const finish = useCallback(() => {
    if (timer.current !== null) clearTimeout(timer.current);
    timer.current = null;
    setStartedAt(null);
  }, []);

  useEffect(() => {
    window.addEventListener("popstate", finish);
    return () => {
      window.removeEventListener("popstate", finish);
      if (timer.current !== null) clearTimeout(timer.current);
    };
  }, [finish]);

  function start() {
    if (pathname !== "/" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    if (timer.current !== null) clearTimeout(timer.current);
    setStartedAt(performance.now());
    timer.current = setTimeout(finish, TRANSITION_DURATION);
  }

  const isLibrary = pathname === "/";
  const transition = isLibrary || pathname.startsWith("/courses/") ? startedAt : null;

  return (
    <SkyTransition.Provider value={{ startedAt: transition, start, finish }}>
      {children}
      {transition !== null && (
        <div
          key={transition}
          className={styles.overlay}
          data-prisma-sky-transition=""
          data-arriving={!isLibrary}
          aria-hidden="true"
        >
          <div className={`${styles.scene} ${morningStyles.morningSurface}`}>
            <div className={`${morningStyles.clouds} ${styles.cloudReveal}`}>
              <span />
              <span />
              <span />
            </div>
          </div>
          <div className={`${styles.scene} ${styles.white}`} />
        </div>
      )}
    </SkyTransition.Provider>
  );
}

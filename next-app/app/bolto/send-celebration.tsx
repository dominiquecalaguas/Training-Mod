'use client';

import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { burstConfetti } from './confetti';
import { DialogClose, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Asset, BoltoButton } from './components';
import tokens from './tokens.module.css';
import review from './review.module.css';
import styles from './send-celebration.module.css';

/** A short-lived, decorative overlay. Nothing is persisted or replayed on refresh. */
function Confetti() {
  const container = useRef<HTMLDivElement>(null);
  useEffect(() => {
    return burstConfetti(container.current,
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      { width: window.innerWidth, height: window.innerHeight });
  }, []);
  return typeof document === "undefined" ? null : createPortal(
    <div ref={container} className={`${tokens.scope} ${styles.confetti}`} aria-hidden="true" />, document.body);
}

export function SendCelebration({ candidateName, onDismiss }: {
  candidateName: string; onDismiss: () => void;
}) {
  const done = useRef<HTMLButtonElement>(null);
  return <DialogContent showCloseButton={false}
    className={`${tokens.scope} ${review.dialog} ${styles.success}`}
    onOpenAutoFocus={event => { event.preventDefault(); done.current?.focus(); }}>
    <Confetti />
    <div className={styles.message}>
      <Asset name="check" />
      <div>
        <DialogTitle className={styles.title}>Offer sent!</DialogTitle>
        <DialogDescription className={styles.description}>
          Your offer for {candidateName} has been successfully sent for e-signature.
        </DialogDescription>
        <p className={styles.disclosure}>Prototype simulation — no actual email or e-signature request was sent.</p>
      </div>
    </div>
    <div className={styles.actions}>
      <DialogClose asChild><BoltoButton ref={done} onClick={onDismiss}>Done</BoltoButton></DialogClose>
    </div>
  </DialogContent>;
}

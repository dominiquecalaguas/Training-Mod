'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Asset } from './components';
import { wizardSteps } from './wizard-navigation';
import styles from './breadcrumb.module.css';

export function OfferBreadcrumb() {
  const pathname = usePathname();
  return <nav className={styles.progress} aria-label="Offer creation progress">
    <ol className={styles.steps}>
      {wizardSteps.map((step, index) => <li key={step.href} className={styles.step}>
        {index > 0 && <Asset name="chevron" />}
        <Link href={step.href} aria-current={pathname === step.href ? 'step' : undefined}>
          {step.label}
        </Link>
      </li>)}
    </ol>
  </nav>;
}

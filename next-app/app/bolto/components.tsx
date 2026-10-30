"use client";

import { useId, type ComponentProps, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  DialogClose, DialogContent, DialogDescription, DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { numeric } from "./compensation/model";
import type { Offer } from "./offer";
import flow from "./flow.module.css";
import { dateLabel, letterFacts, money } from "./offer";
import styles from "./review.module.css";
import tokens from "./tokens.module.css";

const assets = {
  logo: { file: "logo-ink.svg", width: 148.5, height: 32 },
  complete: { file: "complete.svg", width: 16, height: 16 },
  check: { file: "check-circle.svg", width: 20, height: 20 },
  chevron: { file: "chevron-right.svg", width: 20, height: 20 },
  expand: { file: "expand.svg", width: 21.5437, height: 20 },
  close: { file: "close.svg", width: 20, height: 20 },
  divider: { file: "card-divider.svg", width: 562, height: 1 },
  letterDivider: { file: "letter-divider.svg", width: 480, height: 1 },
  letterLines: { file: "letter-lines.svg", width: 442, height: 190 },
} as const;

export function Asset({ name, alt = "", className }: {
  name: keyof typeof assets; alt?: string; className?: string;
}) {
  const { file, width, height } = assets[name];
  // eslint-disable-next-line @next/next/no-img-element -- Serve exact local Figma SVGs at their intrinsic, sometimes fractional dimensions.
  return <img src={`/bolto/assets/${file}`} width={width} height={height}
    alt={alt} className={className} style={{ width: "auto", height: "auto" }} />;
}

export function BoltoButton({ secondary = false, className, ...props }:
  ComponentProps<typeof Button> & { secondary?: boolean }) {
  return <Button {...props} variant={secondary ? "outline" : "default"}
    className={cn(styles.button, secondary ? styles.secondaryButton : styles.primaryButton, className)} />;
}

export function Divider({ letter = false }: { letter?: boolean }) {
  return <div className={cn(styles.divider, letter && styles.letterDivider)} aria-hidden="true">
    <Asset name={letter ? "letterDivider" : "divider"} />
  </div>;
}

export function SummaryCard({ title, onEdit, children, className, complete = true }: {
  title: string; onEdit: () => void; children: ReactNode; className?: string; complete?: boolean;
}) {
  const titleId = useId();
  return (
    <section className={cn(styles.card, className)} aria-labelledby={titleId}>
      <div className={styles.cardHeading}>
        <div className={styles.titleActions}>
          <h3 id={titleId} className={styles.cardTitle}>{title}</h3>
          <button type="button" className={styles.editLink} onClick={onEdit}
            aria-label={`Edit ${title}`}>Edit</button>
        </div>
        {complete ? <Asset name="complete" alt="Complete" /> : <span className={flow.indicator} role="img" aria-label="Incomplete" />}
      </div>
      <Divider />
      {children}
    </section>
  );
}

export function DetailRow({ label, children, className }: {
  label: string; children: ReactNode; className?: string;
}) {
  return <dl className={styles.row}><dt>{label}</dt><dd className={className}>{children}</dd></dl>;
}

export function SuccessCallout({ title, children }: { title: string; children: ReactNode }) {
  return <div className={styles.callout} role="status">
    <Asset name="check" />
    <div><p className={styles.calloutTitle}>{title}</p>
      <p className={styles.calloutBody}>{children}</p></div>
  </div>;
}

export function BoltoDialog({ title, description, children }: {
  title: string; description: string; children: ReactNode;
}) {
  return <DialogContent showCloseButton={false} className={`${tokens.scope} ${styles.dialog}`}>
    <div className={styles.dialogHeader}>
      <div><DialogTitle className={styles.dialogTitle}>{title}</DialogTitle>
        <DialogDescription className={styles.dialogDescription}>{description}</DialogDescription></div>
      <DialogClose asChild><button type="button" className={styles.iconButton} aria-label="Close dialog">
        <Asset name="close" />
      </button></DialogClose>
    </div>
    {children}
  </DialogContent>;
}

export function LetterDocument({ offer, expanded = false }: { offer: Offer; expanded?: boolean }) {
  return <article className={styles.letter} aria-label="Fictional offer letter">
    <h3 className={styles.letterCompany}>COMPANY NAME</h3>
    <Divider letter />
    <div className={styles.letterBody}>
      {/* Fixed fictional issue date; independent of offer dates and validation. */}
      <p className={styles.letterDate}><time dateTime="2026-05-09">May 9, 2026</time></p>
      <p className={styles.letterParagraph}>Dear {offer.name.split(" ")[0]},</p>
      <p className={styles.letterParagraph}>{offer.draft.template.kind === "Concise" ? `Role: ${offer.role} at COMPANY NAME.` : offer.draft.template.kind === "Company template" ? `Company template placeholder: ${offer.role} at COMPANY NAME.` : `We are pleased to offer you the position of ${offer.role} at COMPANY NAME.`}</p>
      <p className={cn(styles.letterParagraph, !expanded && styles.compensationParagraph)}>
        {expanded ? letterFacts(offer).join(' ') : <>
          {offer.draft.compensation.payType === 'full-time' ? <>Your annual <span className={styles.letterHighlight}>base salary will be {money(offer.salary)}</span></> : <span className={styles.letterHighlight}>{offer.draft.compensation.contractType === 'hourly' ? `Hourly rate: ${money(offer.salary)} per hour` : `Fixed project fee: ${money(offer.salary)}`}</span>}
          {offer.draft.compensation.bonusIncluded && <>, with a <span className={styles.letterHighlight}>signing bonus of {money(offer.bonus)}</span></>}
          {offer.draft.compensation.equityIncluded && <> and <span className={styles.letterHighlight}>{numeric(offer.options)?.toLocaleString('en-US')} {offer.draft.compensation.equityType === 'rsu' ? 'RSUs' : 'stock options'}</span>{offer.draft.compensation.equityType === 'options' && <> at <span className={styles.letterHighlight}>{money(offer.exercisePrice,2)} per share</span></>}</>}.
        </>}
      </p>
      {expanded ? <>
        <p className={styles.letterParagraph}>
          Your anticipated start date is {dateLabel(offer.startDate)}. You will report to {offer.manager}.
          Your employment arrangement is {offer.employment}.
        </p>
        {offer.draft.compensation.payType === 'contract' && <p className={styles.letterParagraph}>Contract end date: {dateLabel(offer.draft.compensation.endDate)}.</p>}
        <p className={styles.letterParagraph}>
          Please review this offer by {dateLabel(offer.expires)}. We look forward to welcoming you to the team.
        </p>
        <p className={styles.letterParagraph}>Illustrative prototype language. COMPANY NAME and company-specific legal clauses are placeholders; no company template or binding legal terms have been supplied.</p>
      </> : <Asset name="letterLines" className={styles.letterLines} />}
      <div className={styles.signature}><p>Sincerely,</p><p>{offer.sender}</p><p>{offer.senderTitle}</p></div>
    </div>
  </article>;
}

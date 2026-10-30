"use client";

import { type ComponentProps, type ReactNode, useId } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { CurrencyInput } from "./currency-input";
import styles from "./compensation.module.css";

const assetSizes = {
  "radio-selected": [16, 16], radio: [16, 16], included: [16, 16],
  "choice-selected": [16, 16], choice: [16, 16], divider: [392, 1],
  dollar: [20, 20], calendar: [20, 20], candidate: [20, 20], warning: [20, 20],
} as const;

export function CompAsset({ name }: { name: keyof typeof assetSizes }) {
  const [width, height] = assetSizes[name];
  // eslint-disable-next-line @next/next/no-img-element -- Preserve the approved local Figma SVG geometry.
  return <img src={`/bolto/compensation/${name}.svg`} width={width} height={height} alt="" style={{ width: "auto", height: "auto" }} />;
}

export function FormDivider() {
  return <div className={styles.divider} aria-hidden="true"><CompAsset name="divider" /></div>;
}

export function Required({ children, required = true }: { children: ReactNode; required?: boolean }) {
  return <span className={styles.label}>{children}{required && <span className={styles.required} aria-hidden="true">*</span>}</span>;
}

export function Field({ label, error, help, required = true, icon, suffix, currency = false, className, ...inputProps }:
  Omit<ComponentProps<typeof Input>, "onBlur"> & {
    label: string; error?: string; help?: string; required?: boolean;
    icon?: "dollar" | "calendar"; suffix?: string; currency?: boolean; onBlur?: () => void;
  }) {
  const generated = useId();
  const id = inputProps.id ?? generated;
  const Control = currency ? CurrencyInput : Input;
  return <div className={cn(styles.field, className)}>
    <label htmlFor={id}><Required required={required}>{label}</Required></label>
    <div className={cn(styles.inputShell, error && styles.invalid, inputProps.value !== "" && styles.filled)}>
      {icon && <CompAsset name={icon} />}
      <Control {...inputProps} id={id} className={styles.input} aria-required={required}
        aria-invalid={!!error} aria-describedby={error ? `${id}-error` : help ? `${id}-help` : undefined} />
      {suffix && <span className={styles.suffix}>{suffix}</span>}
    </div>
    {error && <p className={styles.error} id={`${id}-error`}>{error}</p>}
    {help && <p className={styles.help} id={`${id}-help`}>{help}</p>}
  </div>;
}

export function Choice({ name, label, checked, onChange, onBlur, card = false, description, errorId }: {
  name: string; label: string; checked: boolean; onChange: () => void; onBlur?: () => void;
  card?: boolean; description?: string; errorId?: string;
}) {
  return <label className={cn(card ? styles.choiceCard : styles.choice, checked && styles.selected)}>
    <input type="radio" name={name} value={label} checked={checked} onChange={onChange} onBlur={onBlur}
      className={styles.nativeChoice} aria-label={label} aria-describedby={errorId} />
    {!card && <CompAsset name={checked ? "choice-selected" : "choice"} />}
    <span className={styles.choiceText}>{label}{description && checked && <span className={styles.choiceDescription}>{description}</span>}</span>
    {card && <CompAsset name={checked ? "radio-selected" : "radio"} />}
  </label>;
}

export function Include({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return <label className={styles.includeRow}>
    <span className={styles.label}>{label}</span>
    <input type="checkbox" checked={checked} onChange={onChange} className={styles.nativeChoice} aria-label={`Include ${label.toLowerCase()}`} />
    <span className={cn(styles.includeAction, checked && styles.included)}>{checked ? "Included" : "Include"}
      <CompAsset name={checked ? "included" : "choice"} /></span>
  </label>;
}

"use client";

import { OfferBreadcrumb } from "../breadcrumb";
import { useRouter } from "next/navigation";
import { useOfferDraft } from "../draft-provider";
import { validateOffer } from "../draft";
import { useRef, useState, type FormEvent, type ReactNode } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Asset, BoltoButton, BoltoDialog } from "../components";
import { CompensationChart } from "./chart";
import { Choice, CompAsset, Field, FormDivider, Include, Required } from "./controls";
import {
  equityValue, formState, numeric,
  usd, validate, vestingSchedules, type Compensation, type FieldKey,
} from "./model";
import styles from "./compensation.module.css";

export function CompensationScreen() {
  const {draft,update: updateDraft,save:saveOffer} = useOfferDraft();
  const data = draft.compensation;
  const router = useRouter();
  const [touched, setTouched] = useState<Partial<Record<FieldKey, boolean>>>({});
  const [attempted, setAttempted] = useState(false);
  const [message, setMessage] = useState("");
  const [confirm, setConfirm] = useState(false);

  const form = useRef<HTMLFormElement>(null);
  const errors = validate(data);
  const state = formState(data, touched, attempted);
  const requiredErrors = validateOffer(draft).filter(i=>i.section === "compensation");
  const ready = requiredErrors.length === 0;
  const estimate = equityValue(data);
  const error = (key: FieldKey) => touched[key] || attempted ? errors[key] : undefined;
  const blur = (key: FieldKey) => () => setTouched(t => ({ ...t, [key]: true }));
  function update<K extends FieldKey>(key: K, value: Compensation[K]) {
    updateDraft(previous => ({ ...previous, compensation: { ...previous.compensation, [key]: value } }));
    if (["payType", "contractType", "bonusIncluded", "bonusTiming", "equityIncluded", "equityType"].includes(key)) setAttempted(false);
    setMessage("");
  }
  function save() { setMessage(saveOffer() ? "Offer draft saved in this browser." : "Could not save to browser storage."); }
  function proceed(event: FormEvent) {
    event.preventDefault();
    setAttempted(true);
    if (!ready) {
      setMessage("Complete the required fields before continuing. You can save an incomplete draft.");
      const first = requiredErrors[0]?.field;
      const control = form.current?.querySelector<HTMLElement>(`[name="${first}"]`);
      control?.closest("details")?.setAttribute("open", "");
      control?.focus();
      return;
    }
    if (data.bonusIncluded !== data.equityIncluded) setConfirm(true);
    else router.push("/bolto/hire-setup");
  }
  function numberField(key: FieldKey, label: string, options: { optional?: boolean; dollar?: boolean; suffix?: string; help?: string } = {}) {
    return <Field key={key} name={key} label={label} value={String(data[key])} inputMode="decimal" type="text"
      currency={["salary", "hourlyRate", "projectFee", "bonus", "exercisePrice", "optionsSharePrice", "rsuSharePrice"].includes(key)}
      required={!options.optional} error={error(key)} onBlur={blur(key)} maxLength={24}
      onChange={e => update(key, e.target.value as Compensation[typeof key])}
      icon={options.dollar ? "dollar" : undefined} suffix={options.suffix} help={options.help} />;
  }
  function group(key: FieldKey, label: string, children: ReactNode, className?: string) {
    return <fieldset className={className ?? styles.group} aria-describedby={error(key) ? `${key}-error` : undefined}>
      <legend><Required>{label}</Required></legend>
      {children}
      {error(key) && <p id={`${key}-error`} className={styles.error}>{error(key)}</p>}
    </fieldset>;
  }
  const choice = (key: "payType" | "contractType" | "bonusTiming" | "equityType" | "vesting", value: string, label: string, card = false, description?: string) =>
    <Choice key={value} name={key} label={label} checked={data[key] === value} onChange={() => update(key, value as never)}
      onBlur={blur(key)} card={card} description={description} errorId={error(key) ? `${key}-error` : undefined} />;

  return <div className={styles.screen} data-form-state={state}>
    <div className={styles.container}>
      <header>
        <Asset name="logo" alt="Bolto" />
        <OfferBreadcrumb />
      </header>
      <main>
        <h1 className={styles.title}>Compensation</h1>
        <p className={styles.subtitle}>Define the terms of the candidate’s offer.</p>
        <form ref={form} onSubmit={proceed} noValidate>
          <div className={styles.columns}>
            <div className={styles.left}>
              <div className={styles.candidate}><CompAsset name="candidate" /><span>{draft.candidate.name || "Candidate not entered"} • {draft.candidate.role || "Role not entered"}</span></div>
              <section className={styles.formCard} aria-labelledby="compensation-details" tabIndex={0}>
                <h2 id="compensation-details" className={styles.formTitle}>Compensation details</h2>
                <FormDivider />
                <div className={styles.payFields}>
                  {group("payType", "Pay type", <div className={styles.payChoices}>
                    {choice("payType", "full-time", "Full-time", true)}{choice("payType", "contract", "Contract", true)}
                  </div>)}
                  {data.payType === "full-time" && numberField("salary", "Base amount", { dollar: true, suffix: "/ year" })}
                  {data.payType === "contract" && <>
                    {group("contractType", "Compensation type", <div className={styles.choices}>
                      {choice("contractType", "hourly", "Hourly rate")}{choice("contractType", "fixed", "Fixed project fee")}
                    </div>)}
                    {data.contractType && numberField(data.contractType === "hourly" ? "hourlyRate" : "projectFee", "Base amount", { dollar: true, suffix: data.contractType === "hourly" ? "/ hour" : "/ project" })}
                    <Field label="End date" name="endDate" type="date" icon="calendar" value={data.endDate} onChange={e => update("endDate", e.target.value)} onBlur={blur("endDate")} error={error("endDate")} min={data.startDate} max="9999-12-31" />
                    {data.contractType === "hourly" && numberField("weeklyHours", "Assumed hours per week", { help: "Chart assumption only; not an additional contract term." })}
                  </>}
                </div>
                <div className={styles.additional}>
                  <h3>Additional compensation</h3><FormDivider />
                  <div className={styles.optionalSections}>
                    <section aria-label="Signing bonus">
                      <Include label="Signing bonus" checked={data.bonusIncluded} onChange={() => update("bonusIncluded", !data.bonusIncluded)} />
                      {data.bonusIncluded && <div className={styles.conditional}>
                        {numberField("bonus", "Bonus amount ($)")}
                        {group("bonusTiming", "Payment timing", <div className={styles.choices}>
                          {choice("bonusTiming", "first", "First paycheck")}{choice("bonusTiming", "custom", "Custom payment timing")}
                        </div>)}
                        {data.bonusTiming === "custom" && <Field label="Custom payment date" name="bonusDate" type="date" icon="calendar" value={data.bonusDate} onChange={e => update("bonusDate", e.target.value)} onBlur={blur("bonusDate")} error={error("bonusDate")} min={data.startDate} max="9999-12-31" />}
                        <div className={styles.field}><label htmlFor="bonus-conditions">Additional conditions (optional)</label>
                          <Textarea id="bonus-conditions" className={styles.conditions} value={data.conditions} onChange={e => update("conditions", e.target.value)} maxLength={2000} rows={2} />
                        </div>
                      </div>}
                    </section>
                    <section aria-label="Equity">
                      <Include label="Equity" checked={data.equityIncluded} onChange={() => update("equityIncluded", !data.equityIncluded)} />
                      {data.equityIncluded && <div className={styles.conditional}>
                        {group("equityType", "Equity type", <div className={styles.equityChoices}>
                          {choice("equityType", "rsu", "Restricted Stock Units (RSUs)", true, "Company shares granted to an employee that become theirs over time as they vest.")}
                          {choice("equityType", "options", "Stock options", true, "The right to purchase company shares at a predetermined price.")}
                        </div>)}
                        {data.equityType && <>
                          {numberField(data.equityType === "options" ? "options" : "units", data.equityType === "options" ? "Number of options" : "Number of units")}
                          {data.equityType === "options" && numberField("exercisePrice", "Exercise price / share ($)")}
                          {group("vesting", "Vesting schedule", <>
                            <div className={styles.choices}>{Object.entries(vestingSchedules).map(([value, config]) => choice("vesting", value, config.label))}</div>
                            <p className={styles.help}>Used for the estimated compensation chart, not a guaranteed payout. Actual grant dates and cliff terms need to be captured.</p>
                          </>)}
                          <section className={styles.calculator} aria-labelledby="equity-calculator">
                            <h4 id="equity-calculator">Estimated equity value</h4>
                            <p className={styles.help}>Optional calculator for the chart displayed</p>
                            <div className={styles.calculatorFields}>
                              {numberField(data.equityType === "options" ? "optionsSharePrice" : "rsuSharePrice", "Assumed future share price ($)", { optional: true })}
                              <div className={styles.estimate} aria-live="polite">
                                <p>{data.equityType === "options" ? "Hypothetical option intrinsic value" : "Estimated RSU value"}</p>
                                <strong>{estimate === null ? "Not estimated" : usd(estimate)}</strong>
                                <p>{estimate === null ? "Enter a valid grant quantity and assumed future share price to estimate value." : data.equityType === "options"
                                  ? `${numeric(data.options)!.toLocaleString("en-US")} options × max(${usd(numeric(data.optionsSharePrice)!)} − ${usd(numeric(data.exercisePrice)!)}, $0)`
                                  : `${numeric(data.units)!.toLocaleString("en-US")} units × ${usd(numeric(data.rsuSharePrice)!)}`}</p>
                              </div>
                            </div>
                          </section>
                        </>}
                      </div>}
                    </section>
                  </div>
                </div>
              </section>
            </div>
            <CompensationChart data={data} assumptions={<Field label="Chart start date" name="startDate" type="date" icon="calendar" value={data.startDate} onChange={e => update("startDate", e.target.value)} onBlur={blur("startDate")} error={error("startDate")} min="1900-01-01" max="9995-12-31" />} />
          </div>
          <footer className={styles.footer}>
            <BoltoButton type="button" secondary className={styles.action} onClick={save}>Save as draft</BoltoButton>
            <p className={styles.message} role="status">{message}</p>
            <BoltoButton type="submit" className={styles.action} aria-disabled={!ready}>Next: Hire Setup</BoltoButton>
          </footer>
          <p className={styles.srOnly} aria-live="polite">Compensation form: {state === "partial" ? "partially filled" : state}.</p>
        </form>
      </main>
    </div>
    <Dialog open={confirm} onOpenChange={setConfirm}>
      <BoltoDialog title="Review additional compensation" description="Confirm that you have considered all available compensation options.">
        <div className={styles.warning}>
          <CompAsset name="warning" /><div>
            <p className={styles.warningTitle}>Are you sure you want to proceed?</p>
            <p>The following additional compensation option has not been selected:</p>
            <ul><li>{data.bonusIncluded ? "Equity" : "Signing bonus"}</li></ul>
            <div className={styles.warningActions}>
              <button type="button" onClick={() => setConfirm(false)}>Go back</button>
              <button type="button" onClick={() => { setConfirm(false); router.push("/bolto/hire-setup"); }}>Yes, I’m sure</button>
            </div>
          </div>
        </div>
      </BoltoDialog>
    </Dialog>
  </div>;
}

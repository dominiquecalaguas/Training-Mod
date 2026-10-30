export type PayType = "" | "full-time" | "contract";
export type Vesting = "" | "equal" | "front" | "back";
export type Compensation = {
  payType: PayType;
  salary: string;
  contractType: "" | "hourly" | "fixed";
  hourlyRate: string;
  projectFee: string;
  endDate: string;
  startDate: string;
  weeklyHours: string;
  bonusIncluded: boolean;
  bonus: string;
  bonusTiming: "" | "first" | "custom";
  bonusDate: string;
  conditions: string;
  equityIncluded: boolean;
  equityType: "" | "options" | "rsu";
  options: string;
  units: string;
  exercisePrice: string;
  optionsSharePrice: string;
  rsuSharePrice: string;
  vesting: Vesting;
};

export const emptyCompensation: Compensation = {
  payType: "", salary: "", contractType: "", hourlyRate: "", projectFee: "",
  endDate: "", startDate: "2026-06-15", weeklyHours: "40",
  bonusIncluded: false, bonus: "", bonusTiming: "", bonusDate: "", conditions: "",
  equityIncluded: false, equityType: "", options: "", units: "", exercisePrice: "",
  optionsSharePrice: "", rsuSharePrice: "", vesting: "",
};

export const DRAFT_KEY = "bolto:compensation-draft:v1";
export const vestingSchedules = {
  equal: { label: "4 years - Equal vesting (25% annually)", fractions: [0.25, 0.25, 0.25, 0.25] },
  front: { label: "4 years - Front-loaded (40/30/20/10%)", fractions: [0.4, 0.3, 0.2, 0.1] },
  back: { label: "4 years - Back-loaded (10/20/30/40%)", fractions: [0.1, 0.2, 0.3, 0.4] },
} as const;

export type FieldKey = keyof Compensation;
export type Errors = Partial<Record<FieldKey, string>>;
export const round = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;

export function numeric(raw: string): number | null {
  if (raw.includes(",") && !/^-?\d{1,3}(,\d{3})+(\.\d*)?$/.test(raw.trim())) return null;
  const text = raw.trim().replaceAll(",", "");
  if (!/^-?(?:\d+\.?\d*|\.\d+)$/.test(text)) return null;
  const value = Number(text);
  return Number.isFinite(value) && Math.abs(value) <= 1e12 ? value : null;
}

export function dateValue(raw: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return null;
  const value = Date.parse(`${raw}T00:00:00Z`);
  return Number.isFinite(value) && new Date(value).toISOString().slice(0, 10) === raw ? value : null;
}

// Calendar-month arithmetic clamps anniversaries such as January 31 to February's last day.
export function addMonths(time: number, months: number): number {
  const date = new Date(time);
  const first = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, 1));
  const last = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0)).getUTCDate();
  first.setUTCDate(Math.min(date.getUTCDate(), last));
  return first.getTime();
}

const DAY = 86_400_000;
export function horizonEnd(data: Compensation): number | null {
  const start = dateValue(data.startDate);
  if (start === null) return null;
  return data.payType === "contract" ? dateValue(data.endDate) : addMonths(start, 48) - DAY;
}

export function validate(data: Compensation): Errors {
  const errors: Errors = {};
  const requireChoice = (key: FieldKey, message: string) => { if (!data[key]) errors[key] = message; };
  const amount = (key: FieldKey, zero = false, integer = false) => {
    const raw = String(data[key]);
    const n = numeric(raw);
    if (!raw.trim()) errors[key] = "This field is required.";
    else if (n === null) errors[key] = "Enter a valid number (up to 1 trillion).";
    else if (integer && (!Number.isInteger(n) || n <= 0)) errors[key] = "Enter a positive whole number.";
    else if (zero ? n < 0 : n <= 0) errors[key] = zero ? "Amount must be 0 or greater." : "Amount entered must be greater than 0.";
  };
  requireChoice("payType", "Select a pay type.");
  if (data.payType) {
    if (dateValue(data.startDate) === null || data.startDate < "1900-01-01" || data.startDate > "9995-12-31") errors.startDate = "Enter a valid chart start date between 1900 and 9995.";
    if (data.payType === "full-time") amount("salary");
    else {
      requireChoice("contractType", "Select a compensation type.");
      if (data.contractType === "hourly") { amount("hourlyRate"); amount("weeklyHours"); }
      if (data.contractType === "fixed") amount("projectFee");
      const end = dateValue(data.endDate), start = dateValue(data.startDate);
      if (end === null) errors.endDate = "Enter a valid end date.";
      else if (start !== null && end <= start) errors.endDate = "Contract end date must be after the start date.";
    }
  }
  if (data.bonusIncluded) {
    amount("bonus"); requireChoice("bonusTiming", "Select a payment timing.");
    if (data.bonusTiming === "custom") {
      const day = dateValue(data.bonusDate), start = dateValue(data.startDate), end = horizonEnd(data);
      if (day === null) errors.bonusDate = "Enter a valid payment date.";
      else if (start !== null && day < start) errors.bonusDate = "Payment date must be on or after the chart start date.";
      else if (end !== null && day > end) errors.bonusDate = "Payment date must fall within the visualization period.";
    }
  }
  if (data.equityIncluded) {
    requireChoice("equityType", "Select an equity type.");
    if (data.equityType) {
      amount(data.equityType === "options" ? "options" : "units", false, true);
      if (data.equityType === "options") amount("exercisePrice", true);
      requireChoice("vesting", "Select a vesting schedule.");
      const shareKey = data.equityType === "options" ? "optionsSharePrice" : "rsuSharePrice";
      if (data[shareKey].trim()) amount(shareKey, true);
    }
  }
  return errors;
}

/** Null means unestimated, never a fictional zero. Exercise price is a cost, not option value. */
export function equityValue(data: Compensation): number | null {
  if (!data.equityIncluded || !data.equityType) return null;
  const count = numeric(data.equityType === "options" ? data.options : data.units);
  const future = numeric(data.equityType === "options" ? data.optionsSharePrice : data.rsuSharePrice);
  if (count === null || count <= 0 || !Number.isInteger(count) || future === null || future < 0) return null;
  const exercise = numeric(data.exercisePrice);
  if (data.equityType === "options" && (exercise === null || exercise < 0)) return null;
  const value = count * (data.equityType === "options" ? Math.max(future - exercise!, 0) : future);
  return Number.isSafeInteger(Math.round(value * 100)) ? round(value) : null;
}

export function annualEquity(data: Compensation): number[] | null {
  const total = equityValue(data);
  if (total === null || !data.vesting) return null;
  const values = vestingSchedules[data.vesting].fractions.map(f => round(total * f));
  values[3] = round(total - values[0] - values[1] - values[2]);
  return values;
}

export type ChartPeriod = {
  label: string; start: number; end: number;
  base: number | null; bonus: number | null; equity: number | null;
};

/** Full-time: annual buckets. Contracts: actual inclusive duration, monthly up to one year,
 * then annual buckets (grouped for very long contracts). No automatic renewals.
 * Fixed fees are allocated once, proportionally to days. Hourly uses days / 7 × weekly hours.
 * Hypothetical equity accrues evenly inside each of the four annual vesting buckets;
 * a shorter contract includes only the overlap, with no accelerated vesting assumption.
 */
export function chartPeriods(data: Compensation): ChartPeriod[] {
  const errors = validate(data);
  const start = dateValue(data.startDate), last = horizonEnd(data);
  if (!data.payType || errors.startDate || start === null || last === null || last < start || (data.payType === "contract" && !!errors.endDate)) return [];
  const end = last + DAY;
  const months = data.payType === "full-time" ? 12 : (end - start <= 366 * DAY ? 1 : 12 * Math.ceil((end - start) / (366 * DAY * 8)));
  const periods: ChartPeriod[] = [];
  const annual = annualEquity(data);
  const bonusDay = data.bonusTiming === "first" ? start : dateValue(data.bonusDate);
  let cursor = start, index = 0;
  while (cursor < end && index < 16) {
    const next = Math.min(addMonths(start, (index + 1) * months), end);
    let base: number | null = null;
    if (data.payType === "full-time" && !errors.salary) base = numeric(data.salary);
    if (data.payType === "contract" && data.contractType === "hourly" && !errors.hourlyRate && !errors.weeklyHours) {
      base = round(numeric(data.hourlyRate)! * numeric(data.weeklyHours)! * (next - cursor) / DAY / 7);
    }
    if (data.payType === "contract" && data.contractType === "fixed" && !errors.projectFee) {
      base = round(numeric(data.projectFee)! * (next - cursor) / (end - start));
    }
    let equity: number | null = null;
    if (annual) {
      equity = 0;
      for (let year = 0; year < 4; year++) {
        const a = addMonths(start, year * 12), b = addMonths(start, (year + 1) * 12);
        equity += annual[year] * Math.max(0, Math.min(next, b) - Math.max(cursor, a)) / (b - a);
      }
      equity = round(equity);
    }
    const bonus = data.bonusIncluded && !errors.bonus && !errors.bonusTiming && !errors.bonusDate && bonusDay !== null
      ? (bonusDay >= cursor && bonusDay < next ? numeric(data.bonus) : 0) : null;
    const label = data.payType === "full-time" ? `Year ${index + 1}` : months === 1 ? `Month ${index + 1}` : months === 12 ? `Year ${index + 1}` : `Years ${index * months / 12 + 1}–${(index + 1) * months / 12}`;
    periods.push({ label, start: cursor, end: next, base, equity, bonus });
    cursor = next; index++;
  }
  // Preserve the exact project-fee total despite per-bucket cent rounding.
  if (data.payType === "contract" && data.contractType === "fixed" && !errors.projectFee && periods.length) {
    const previous = periods.slice(0, -1).reduce((sum, p) => sum + (p.base ?? 0), 0);
    periods[periods.length - 1].base = round(numeric(data.projectFee)! - previous);
  }
  return periods;
}

export function formState(data: Compensation, touched: Partial<Record<FieldKey, boolean>>, attempted: boolean) {
  const errors = validate(data);
  const shown = Object.keys(errors).some(k => attempted || touched[k as FieldKey]);
  if (shown) return "invalid";
  if (!Object.keys(errors).length) return "ready";
  return !data.payType && !data.bonusIncluded && !data.equityIncluded ? "empty" : "partial";
}

export function parseDraft(raw: string | null): Compensation | null {
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || !("version" in parsed) || parsed.version !== 1 || !("data" in parsed) || !parsed.data || typeof parsed.data !== "object") return null;
    const source = parsed.data as Record<string, unknown>;
    const result = { ...emptyCompensation };
    for (const key of Object.keys(result) as FieldKey[]) {
      if (typeof source[key] !== typeof result[key]) return null;
      Object.assign(result, { [key]: source[key] });
    }
    if (!["", "full-time", "contract"].includes(result.payType) || !["", "hourly", "fixed"].includes(result.contractType)
      || !["", "options", "rsu"].includes(result.equityType) || !["", "first", "custom"].includes(result.bonusTiming)
      || !["", "equal", "front", "back"].includes(result.vesting)) return null;
    return result;
  } catch { return null; }
}

/** A discriminated active payload: excluded and inactive configurations never leak into the offer. */
export function activeCompensation(data: Compensation) {
  if (Object.keys(validate(data)).length) return null;
  return {
    pay: data.payType === "full-time" ? { type: "full-time" as const, annualSalary: numeric(data.salary)! }
      : data.contractType === "hourly" ? { type: "hourly" as const, rate: numeric(data.hourlyRate)!, endDate: data.endDate }
        : { type: "fixed" as const, projectFee: numeric(data.projectFee)!, endDate: data.endDate },
    bonus: data.bonusIncluded ? { amount: numeric(data.bonus)!, timing: data.bonusTiming, date: data.bonusTiming === "custom" ? data.bonusDate : undefined, conditions: data.conditions } : null,
    equity: !data.equityIncluded ? null : data.equityType === "options"
      ? { type: "options" as const, quantity: numeric(data.options)!, exercisePrice: numeric(data.exercisePrice)!, vesting: data.vesting }
      : { type: "rsu" as const, quantity: numeric(data.units)!, vesting: data.vesting },
    chartAssumptions: { startDate: data.startDate, weeklyHours: data.payType === "contract" && data.contractType === "hourly" ? numeric(data.weeklyHours) : undefined, hypotheticalFutureSharePrice: data.equityIncluded ? numeric(data.equityType === "options" ? data.optionsSharePrice : data.rsuSharePrice) : null },
  };
}

export const usd = (value: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(value).replace(/\.00$/, "");

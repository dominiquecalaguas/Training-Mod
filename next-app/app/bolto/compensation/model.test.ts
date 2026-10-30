import assert from "node:assert/strict";
import test from "node:test";
import {
  activeCompensation, addMonths, annualEquity, chartPeriods, dateValue, emptyCompensation,
  equityValue, formState, numeric, parseDraft, validate, type Compensation,
} from "./model";

const offer = (values: Partial<Compensation> = {}): Compensation => ({ ...emptyCompensation, payType: "full-time", salary: "150000", ...values });
const options = (): Compensation => offer({ equityIncluded: true, equityType: "options", options: "10000", exercisePrice: "5", optionsSharePrice: "100", vesting: "equal" });

test("empty, partial, invalid and ready are distinct interaction states", () => {
  assert.equal(formState(emptyCompensation, {}, false), "empty");
  assert.equal(formState(offer({ salary: "" }), {}, false), "partial");
  assert.equal(formState(offer({ salary: "0" }), { salary: true }, false), "invalid");
  assert.equal(formState(offer({ salary: "" }), {}, true), "invalid");
  assert.equal(formState(offer(), {}, false), "ready");
});

test("corrected option intrinsic value subtracts exercise cost", () => {
  assert.equal(equityValue(options()), 950000);
  assert.deepEqual(annualEquity(options()), [237500, 237500, 237500, 237500]);
  assert.equal(equityValue({ ...options(), options: "1000" }), 95000);
});

test("options floor at zero and accept a zero exercise price", () => {
  assert.equal(equityValue({ ...options(), optionsSharePrice: "2" }), 0);
  assert.equal(equityValue({ ...options(), exercisePrice: "0" }), 1000000);
  assert.equal(validate({ ...options(), exercisePrice: "0" }).exercisePrice, undefined);
});

test("missing or invalid assumptions remain unestimated, not zero", () => {
  for (const price of ["", "-1", "abc"]) assert.equal(equityValue({ ...options(), optionsSharePrice: price }), null);
  const unestimated = { ...options(), optionsSharePrice: "" };
  assert.deepEqual(validate(unestimated), {});
  assert.ok(chartPeriods(unestimated).every(p => p.equity === null));
});

test("RSUs use units times future price without an exercise cost", () => {
  const data = offer({ equityIncluded: true, equityType: "rsu", units: "1000", rsuSharePrice: "100", vesting: "equal", exercisePrice: "-2" });
  assert.equal(equityValue(data), 100000);
  assert.deepEqual(validate(data), {});
});

test("all vesting distributions preserve total equity value", () => {
  assert.deepEqual(annualEquity({ ...options(), vesting: "front" }), [380000, 285000, 190000, 95000]);
  assert.deepEqual(annualEquity({ ...options(), vesting: "back" }), [95000, 190000, 285000, 380000]);
  const fractional = annualEquity({ ...options(), options: "3", exercisePrice: "0", optionsSharePrice: "0.01" })!;
  assert.equal(Math.round(fractional.reduce((a, b) => a + b, 0) * 100), 3);
});

test("quantity, exercise and optional share-price validation is conditional", () => {
  assert.match(validate({ ...options(), options: "1.5" }).options!, /whole/);
  assert.match(validate({ ...options(), options: "0" }).options!, /whole/);
  assert.ok(validate({ ...options(), exercisePrice: "-1" }).exercisePrice);
  assert.ok(validate({ ...options(), optionsSharePrice: "-1" }).optionsSharePrice);
  assert.deepEqual(validate({ ...options(), equityIncluded: false, options: "invalid", optionsSharePrice: "-1" }), {});
});

test("annual salary and first-paycheck bonus have separate segments", () => {
  const periods = chartPeriods(offer({ bonusIncluded: true, bonus: "10000", bonusTiming: "first" }));
  assert.deepEqual(periods.map(p => p.base), [150000, 150000, 150000, 150000]);
  assert.deepEqual(periods.map(p => p.bonus), [10000, 0, 0, 0]);
});

test("custom bonus timing places the payment in the correct year", () => {
  const data = offer({ bonusIncluded: true, bonus: "10000", bonusTiming: "custom", bonusDate: "2027-07-01" });
  assert.deepEqual(chartPeriods(data).map(p => p.bonus), [0, 10000, 0, 0]);
  assert.ok(validate({ ...data, bonusDate: "2025-01-01" }).bonusDate);
  assert.ok(validate({ ...data, bonusDate: "2035-01-01" }).bonusDate);
});

test("hourly contracts use explicit weekly hours and actual inclusive duration", () => {
  const data = offer({ payType: "contract", contractType: "hourly", hourlyRate: "95", startDate: "2026-06-15", endDate: "2026-07-14", weeklyHours: "40" });
  const periods = chartPeriods(data);
  assert.equal(periods.length, 1);
  assert.equal(periods[0].base, 16285.71);
  assert.equal(periods[0].end, dateValue("2026-07-15"));
  assert.ok(chartPeriods({ ...data, weeklyHours: "" }).every(p => p.base === null));
});

test("fixed fee is counted once, including cent rounding across months", () => {
  const data = offer({ payType: "contract", contractType: "fixed", projectFee: "10000", endDate: "2026-09-14" });
  const periods = chartPeriods(data);
  assert.equal(periods.length, 3);
  assert.equal(periods.reduce((sum, p) => sum + p.base!, 0), 10000);
  assert.ok(periods.every(p => p.base! < 10000));
});

test("contract bonus and equity are supported, with no accelerated four-year grant", () => {
  const data = { ...options(), payType: "contract" as const, contractType: "fixed" as const, projectFee: "10000", endDate: "2026-07-14", bonusIncluded: true, bonus: "1000", bonusTiming: "first" as const };
  const periods = chartPeriods(data);
  assert.equal(periods[0].bonus, 1000);
  assert.ok(periods[0].equity! > 0 && periods[0].equity! < 237500);
  assert.ok(activeCompensation(data)?.equity);
});

test("missing and invalid contract dates do not invent a chart horizon", () => {
  const data = offer({ payType: "contract", contractType: "fixed", projectFee: "1000" });
  assert.deepEqual(chartPeriods(data), []);
  assert.deepEqual(chartPeriods({ ...data, endDate: "2026-06-01" }), []);
  assert.equal(dateValue("2026-02-30"), null);
  assert.equal(new Date(addMonths(dateValue("2028-01-31")!, 1)).toISOString().slice(0, 10), "2028-02-29");
});

test("inactive values persist in drafts but are omitted from active payloads", () => {
  const data = offer({ bonus: "-5", bonusDate: "invalid", options: "999", equityIncluded: false, bonusIncluded: false });
  const restored = parseDraft(JSON.stringify({ version: 1, data }));
  assert.deepEqual(restored, data);
  assert.equal(activeCompensation(data)?.bonus, null);
  assert.equal(activeCompensation(data)?.equity, null);
  assert.equal(activeCompensation(emptyCompensation), null);
});

test("draft parsing rejects corrupted, incomplete and unknown-version data", () => {
  for (const raw of ["oops", "null", "{}", JSON.stringify({ version: 2, data: offer() }), JSON.stringify({ version: 1, data: { ...offer(), payType: "employee" } })]) assert.equal(parseDraft(raw), null);
});

test("numeric parsing accepts currency grouping but rejects malformed and nonfinite inputs", () => {
  assert.equal(numeric("150,000.50"), 150000.5);
  for (const value of ["", "1,2", "Infinity", "1e999", "NaN", "999999999999999999999"]) assert.equal(numeric(value), null);
});

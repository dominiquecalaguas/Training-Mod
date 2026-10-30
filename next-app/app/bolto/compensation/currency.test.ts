import assert from "node:assert/strict";
import test from "node:test";
import { currencyCaret, currencyDraft, deleteAtSeparator, formatCurrencyInput } from "./currency";

test("group all monetary magnitudes immediately without rounding", () => {
  assert.equal(formatCurrencyInput("150000"), "150,000");
  assert.equal(formatCurrencyInput("1500000"), "1,500,000");
  assert.equal(formatCurrencyInput("1500000.0050"), "1,500,000.0050");
  assert.equal(formatCurrencyInput("95.50"), "95.50");
  assert.equal(formatCurrencyInput("5.25"), "5.25");
});

test("preserve empty, partial, zero and invalid input states", () => {
  for (const value of ["", "-", ".", "-.", "95.", "0", "0.00", "1.2.3", "invalid"]) assert.equal(formatCurrencyInput(value), value);
  assert.equal(formatCurrencyInput("-150000"), "-150,000");
});

test("pasted currency text becomes an unformatted decimal draft", () => {
  assert.equal(currencyDraft("$1,500,000.50"), "1500000.50");
  assert.equal(formatCurrencyInput("$1,500,000.50"), "1,500,000.50");
  assert.equal(currencyDraft("95.50"), "95.50");
});

test("caret remains at the same numeric character after regrouping", () => {
  assert.equal(currencyCaret("150000", 6, "150,000"), 7);
  assert.equal(currencyCaret("1520,000", 3, "1,520,000"), 4);
  assert.equal(currencyCaret("150,00", 4, "15,000"), 4);
  assert.equal(currencyCaret("95.50", 4, "95.50"), 4);
});

test("separator-adjacent backspace and delete remove digits naturally", () => {
  assert.deepEqual(deleteAtSeparator("150,000", 4, "Backspace"), { text: "15000", caret: 2 });
  assert.deepEqual(deleteAtSeparator("150,000", 3, "Delete"), { text: "15000", caret: 3 });
  assert.equal(deleteAtSeparator("150,000", 7, "Backspace"), null);
});

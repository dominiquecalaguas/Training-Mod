/** Keep an exact, unrounded decimal draft separately from its grouping separators.
 * Incomplete decimals and negative signs remain editable; validation decides validity.
 */
export function currencyDraft(text: string): string {
  return text.trim().replace(/^\$\s*/, "").replaceAll(",", "");
}

export function formatCurrencyInput(text: string): string {
  const raw = currencyDraft(text);
  if (!/^-?\d*(?:\.\d*)?$/.test(raw)) return raw;
  const [integer, decimal] = raw.split(".");
  return integer.replace(/\B(?=(\d{3})+(?!\d))/g, ",") + (decimal === undefined ? "" : `.${decimal}`);
}

/** Map caret positions by decimal characters, ignoring visual thousands separators. */
export function currencyCaret(text: string, position: number, formatted: string): number {
  const wanted = currencyDraft(text.slice(0, position)).length;
  let seen = 0;
  let index = 0;
  while (index < formatted.length && seen < wanted) {
    if (formatted[index] !== ",") seen++;
    index++;
  }
  return index;
}

/** Backspace/Delete next to a grouping separator should delete a digit, not feel stuck. */
export function deleteAtSeparator(text: string, caret: number, key: string): { text: string; caret: number } | null {
  if (key === "Backspace" && text[caret - 1] === "," && caret > 1) {
    return { text: text.slice(0, caret - 2) + text.slice(caret), caret: caret - 2 };
  }
  if (key === "Delete" && text[caret] === "," && caret + 1 < text.length) {
    return { text: text.slice(0, caret) + text.slice(caret + 2), caret };
  }
  return null;
}

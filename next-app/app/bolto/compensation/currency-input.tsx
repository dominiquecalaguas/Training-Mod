"use client";

import { useLayoutEffect, useRef, type ComponentProps, type ChangeEvent } from "react";
import { Input } from "@/components/ui/input";
import { currencyCaret, currencyDraft, deleteAtSeparator, formatCurrencyInput } from "./currency";

/** Controlled currency input. Consumers receive the unformatted decimal draft through
 * onChange; numeric() in the model supplies numbers to validation and calculations.
 * Keeping decimal text avoids rounding or losing an in-progress decimal/trailing zero.
 */
export function CurrencyInput({ value, onChange, onKeyDown, ...props }: ComponentProps<typeof Input>) {
  const input = useRef<HTMLInputElement>(null);
  const selection = useRef<{ start: number; end: number } | null>(null);
  const formatted = formatCurrencyInput(String(value ?? ""));

  useLayoutEffect(() => {
    if (selection.current && input.current && document.activeElement === input.current) {
      input.current.setSelectionRange(selection.current.start, selection.current.end);
    }
    selection.current = null;
  });

  function change(event: ChangeEvent<HTMLInputElement>) {
    const element = event.currentTarget;
    const text = element.value;
    const next = formatCurrencyInput(text);
    selection.current = {
      start: currencyCaret(text, element.selectionStart ?? text.length, next),
      end: currencyCaret(text, element.selectionEnd ?? text.length, next),
    };
    element.value = currencyDraft(text);
    onChange?.(event);
  }

  return <Input {...props} ref={input} type="text" inputMode="decimal" value={formatted} onChange={change}
    onKeyDown={event => {
      onKeyDown?.(event);
      const element = event.currentTarget;
      if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey || element.selectionStart !== element.selectionEnd) return;
      const deletion = deleteAtSeparator(element.value, element.selectionStart ?? 0, event.key);
      if (!deletion) return;
      event.preventDefault();
      // Use the native input setter plus an input event so React's controlled change
      // handling and the same formatting/caret pipeline also handle separator deletion.
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
      setter?.call(element, deletion.text);
      element.setSelectionRange(deletion.caret, deletion.caret);
      element.dispatchEvent(new Event("input", { bubbles: true }));
    }} />;
}

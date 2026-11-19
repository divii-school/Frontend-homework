"use client";

import { forwardRef, useImperativeHandle, useLayoutEffect, useRef, type InputHTMLAttributes } from "react";
import { InputText } from "primereact/inputtext";
import { formatNumber } from "@/utils/format";

interface MoneyInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "type"> {
  value: number | null;
  onChange: (value: number | null) => void;
  /** true → "₩27,000"; false → "27,000" (quantity). */
  currency?: boolean;
}

/** 13 digits is above the API's INT limit, so the "too large" message can still show. */
const MAX_DIGITS = 13;

function display(value: number | null, currency: boolean): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "";
  return `${currency ? "₩" : ""}${formatNumber(value)}`;
}

// Whole-number input shown with ₩ and thousand separators WHILE typing ("27000" → "₩27,000").
// The form keeps a plain number (or null when empty); every non-digit the user types is dropped.
// The caret is put back after the same digit, so editing in the middle doesn't jump to the end.
const MoneyInput = forwardRef<HTMLInputElement, MoneyInputProps>(function MoneyInput(
  { value, onChange, currency = true, className, ...rest },
  ref,
) {
  const inputRef = useRef<HTMLInputElement>(null);
  const digitsBeforeCaret = useRef<number | null>(null);
  useImperativeHandle(ref, () => inputRef.current as HTMLInputElement);

  const text = display(value, currency);

  // After the formatted text is rendered, move the caret behind the same number of digits
  useLayoutEffect(() => {
    const input = inputRef.current;
    const wanted = digitsBeforeCaret.current;
    if (!input || wanted === null || document.activeElement !== input) return;
    digitsBeforeCaret.current = null;
    let seen = 0;
    let position = 0;
    while (position < text.length && seen < wanted) {
      if (/\d/.test(text[position])) seen += 1;
      position += 1;
    }
    if (wanted === 0) position = currency && text ? 1 : 0;
    input.setSelectionRange(position, position);
  }, [text, currency]);

  return (
    <InputText
      {...rest}
      ref={inputRef}
      type="text"
      inputMode="numeric"
      autoComplete="off"
      className={className}
      value={text}
      onChange={(event) => {
        const raw = event.target.value;
        const caret = event.target.selectionStart ?? raw.length;
        digitsBeforeCaret.current = raw.slice(0, caret).replace(/\D/g, "").length;
        const digits = raw.replace(/\D/g, "").replace(/^0+(?=\d)/, "").slice(0, MAX_DIGITS);
        onChange(digits === "" ? null : Number(digits));
      }}
    />
  );
});

export default MoneyInput;

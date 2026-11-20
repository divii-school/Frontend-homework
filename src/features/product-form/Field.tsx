"use client";

import { useId, type ReactNode } from "react";
import { formatMoneyInput } from "@/lib/format";
import styles from "./ProductForm.module.scss";

interface FieldProps {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: (ids: { id: string; describedBy: string | undefined; invalid: boolean }) => ReactNode;
}

/** Label + control + hint/error, wired with aria-describedby / aria-invalid. */
export function Field({ label, required, error, hint, children }: FieldProps) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy = [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(" ") || undefined;

  return (
    <div className={styles.field}>
      <label htmlFor={id} className={styles.label}>
        {label}
        {required && (
          <span className={styles.required} aria-hidden>
            *
          </span>
        )}
      </label>
      {children({ id, describedBy, invalid: Boolean(error) })}
      {hint && (
        <p id={hintId} className={styles.hint}>
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className={styles.error}>
          {error}
        </p>
      )}
    </div>
  );
}

/** Underline text input (Figma 8.1.1 fields). `money` adds the ₩ prefix and numeric keyboard. */
export function TextInput({
  id,
  describedBy,
  invalid,
  value,
  onChange,
  placeholder,
  maxLength,
  readOnly,
  money,
  numeric,
}: {
  id: string;
  describedBy: string | undefined;
  invalid: boolean;
  value: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
  readOnly?: boolean;
  money?: boolean;
  numeric?: boolean;
}) {
  return (
    <div className={`${styles.underline} ${invalid ? styles.invalid : ""} ${readOnly ? styles["read-only"] : ""}`}>
      {money && (
        <span className={styles.prefix} aria-hidden>
          ₩
        </span>
      )}
      <input
        id={id}
        value={money ? formatMoneyInput(value) : value}
        onChange={(e) =>
          onChange?.(money ? formatMoneyInput(e.target.value) : numeric ? e.target.value.replace(/[^\d,]/g, "") : e.target.value)
        }
        placeholder={placeholder}
        maxLength={maxLength}
        readOnly={readOnly}
        inputMode={numeric || money ? "numeric" : undefined}
        aria-invalid={invalid}
        aria-describedby={describedBy}
        aria-required={!readOnly}
        autoComplete="off"
      />
    </div>
  );
}

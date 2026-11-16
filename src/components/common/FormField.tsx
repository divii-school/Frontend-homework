import type { ReactNode } from "react";

interface FormFieldProps {
  /** id of the input inside; ties the label and the error text to it for screen readers. */
  id: string;
  label: string;
  required?: boolean;
  /** Keep the label for screen readers but do not draw it (the login design shows only a placeholder). */
  hideLabel?: boolean;
  error?: string;
  hint?: string;
  children: ReactNode;
}

/** Label + input + hint + error message in one consistent block. */
export function FormField({ id, label, required, hideLabel, error, hint, children }: FormFieldProps) {
  const labelClass = hideLabel ? "visually-hidden" : `form-field-label${required ? " form-field-label-required" : ""}`;
  return (
    <div className={`form-field${error ? " form-field-invalid" : ""}`}>
      {/* The red asterisk is drawn by CSS, so the label text read by screen readers stays the plain field name. */}
      <label className={labelClass} htmlFor={id}>
        {label}
      </label>
      {children}
      {hint && !error && <p className="form-field-hint">{hint}</p>}
      {error && (
        <p className="form-field-error" id={`${id}-error`} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

/** Props that mark an input as invalid and point it at its error text. */
export const invalidProps = (id: string, error?: string) =>
  error ? { "aria-invalid": true, "aria-describedby": `${id}-error`, className: "p-invalid" } : {};

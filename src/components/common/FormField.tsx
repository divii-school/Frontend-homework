import type { ReactNode } from "react";

interface FormFieldProps {
  /** id of the input inside; ties the label and the error text to it for screen readers. */
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: ReactNode;
}

/** Label + input + hint + error message in one consistent block. */
export function FormField({ id, label, required, error, hint, children }: FormFieldProps) {
  return (
    <div className={`form-field${error ? " form-field-invalid" : ""}`}>
      {/* The red asterisk is drawn by CSS, so the label text read by screen readers stays the plain field name. */}
      <label className={`form-field-label${required ? " form-field-label-required" : ""}`} htmlFor={id}>
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

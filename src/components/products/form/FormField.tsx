import type { ReactNode } from "react";

/** Props every input of the form gets, so label / error / hint are wired the same way everywhere. */
export interface FieldA11yProps {
  id: string;
  "aria-invalid": true | undefined;
  "aria-describedby": string | undefined;
  "aria-required": true | undefined;
  className: string | undefined;
}

interface FormFieldProps {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  hint?: ReactNode;
  /** Extra class on the wrapper, e.g. "product-form-field-wide" (spans both columns). */
  className?: string;
  children: (field: FieldA11yProps) => ReactNode;
}

// One labelled field: visible <label>, the input (render prop), a hint and the error under it.
// The input gets aria-invalid + aria-describedby (error and hint ids), so screen readers read the
// message, and the step's "focus the first invalid field" can find it with [aria-invalid="true"].
export default function FormField({ id, label, required = false, error, hint, className, children }: FormFieldProps) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [errorId, hintId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={["product-form-field", className].filter(Boolean).join(" ")}>
      <label htmlFor={id} className="product-form-label">
        {label}
        {required && (
          <span className="product-form-required" aria-hidden="true">
            *
          </span>
        )}
      </label>
      {children({
        id,
        "aria-invalid": error ? true : undefined,
        "aria-describedby": describedBy,
        "aria-required": required ? true : undefined,
        className: error ? "p-invalid" : undefined,
      })}
      {hint && (
        <p id={hintId} className="field-hint">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="field-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

"use client";

import { STEPS, type StepNumber } from "./product-form.model";

interface ProductFormStepperProps {
  current: StepNumber;
  /** Highest step the user may click (steps after it are reached with "Next" only). */
  unlocked: StepNumber;
  /** Steps with at least one error (client rule or API field error) get a red marker. */
  errorSteps: StepNumber[];
  onSelect: (step: StepNumber) => void;
}

// Step bar above the form: 1 Basic info → 2 Images & status → 3 Category & options → 4 ERP & review.
// Each step is a button (keyboard + screen reader), the current one has aria-current="step".
// Going back is always allowed; a later step only once the steps before it were validated.
// On phones it collapses to "Step 2 of 4 · Images & status" (the same line is read by screen readers).
export default function ProductFormStepper({ current, unlocked, errorSteps, onSelect }: ProductFormStepperProps) {
  const currentLabel = STEPS.find(({ step }) => step === current)?.label ?? "";

  return (
    <nav className="product-stepper" aria-label="입력 단계">
      <p className="product-stepper-compact" aria-live="polite">
        {STEPS.length}단계 중 {current}단계 · {currentLabel}
      </p>
      <ol className="product-stepper-list">
        {STEPS.map(({ step, label }) => {
          const isCurrent = step === current;
          const hasError = errorSteps.includes(step);
          const isDone = step < current && !hasError;
          const locked = step > current && step > unlocked;
          const classes = [
            "product-stepper-item",
            isCurrent ? "product-stepper-item-current" : "",
            isDone ? "product-stepper-item-done" : "",
            hasError ? "product-stepper-item-error" : "",
          ]
            .filter(Boolean)
            .join(" ");

          return (
            <li key={step} className={classes}>
              <button
                type="button"
                className="product-stepper-button"
                aria-current={isCurrent ? "step" : undefined}
                disabled={locked}
                onClick={() => onSelect(step)}
              >
                <span className="product-stepper-index" aria-hidden="true">
                  {hasError ? <i className="pi pi-exclamation-triangle" /> : isDone ? <i className="pi pi-check" /> : step}
                </span>
                <span className="product-stepper-label">
                  <span className="sr-only">{step}단계: </span>
                  {label}
                  {hasError && <span className="sr-only"> (오류 있음)</span>}
                  {isDone && <span className="sr-only"> (완료)</span>}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

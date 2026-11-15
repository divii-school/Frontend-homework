"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "primereact/button";
import { useState, type FormEvent } from "react";
import { ErrorSummary } from "@/components/common/ErrorSummary";
import { BasicStep, CategoryStep, MediaStep, PriceStep, type StepProps } from "@/components/products/ProductFormSteps";
import { useToast } from "@/components/providers/ToastProvider";
import { PRODUCT_FORM_STEPS } from "@/constants/products";
import { ROUTES } from "@/constants/routes";
import { useUrlParam } from "@/hooks/useUrlParam";
import type { ApiError } from "@/types/api";
import type { ProductFormErrors, ProductFormValues, ProductRequest } from "@/types/product";
import { firstInvalidStep, toProductRequest, validateStep } from "@/utils/product-rules";

const STEP_KEYS = PRODUCT_FORM_STEPS.map((step) => step.key);
const STEP_COMPONENTS: Array<(props: StepProps) => React.ReactNode> = [BasicStep, PriceStep, CategoryStep, MediaStep];

interface ProductFormProps {
  mode: "create" | "edit";
  initialValues: ProductFormValues;
  /** The save mutation of the parent screen (create or update). */
  saving: boolean;
  saveError: ApiError | null;
  onSave: (request: ProductRequest, done: () => void) => void;
}

/**
 * The multi-step form, used for both create and edit.
 * How values are kept: ALL fields of ALL steps are one object in this component's state. A step only draws
 * its part of it and reports changes up. Moving between steps unmounts the step, not this component, so going
 * back shows everything as it was; an API error leaves the state untouched too.
 * The current step is in the URL (?step=price), so refresh stays on the step. A refresh does empty the fields:
 * they live in memory, not in the URL.
 */
export function ProductForm({ mode, initialValues, saving, saveError, onSave }: ProductFormProps) {
  const router = useRouter();
  const showToast = useToast();
  const [values, setValues] = useState<ProductFormValues>(initialValues);
  const [errors, setErrors] = useState<ProductFormErrors>({});
  const [stepKey, setStepKey] = useUrlParam("step", STEP_KEYS);
  const stepIndex = STEP_KEYS.indexOf(stepKey);
  const isLast = stepIndex === STEP_KEYS.length - 1;
  const Step = STEP_COMPONENTS[stepIndex];

  // Typing in a field removes that field's error at once.
  const handleChange = (changes: Partial<ProductFormValues>) => {
    setValues((current) => ({ ...current, ...changes }));
    setErrors((current) => {
      const next = { ...current };
      (Object.keys(changes) as (keyof ProductFormValues)[]).forEach((key) => delete next[key]);
      return next;
    });
  };

  // "Next" checks the step on screen. "Back" never checks: the user must always be able to go back.
  const goNext = () => {
    const stepErrors = validateStep(stepIndex, values);
    setErrors(stepErrors);
    if (Object.keys(stepErrors).length === 0) setStepKey(STEP_KEYS[stepIndex + 1]);
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!isLast) {
      goNext();
      return;
    }
    // A step can be reached by URL without passing the earlier ones, so the whole form is checked before saving.
    const invalid = firstInvalidStep(values);
    if (invalid !== -1) {
      setErrors(validateStep(invalid, values));
      setStepKey(STEP_KEYS[invalid]);
      return;
    }
    onSave(toProductRequest(values), () => {
      showToast({ severity: "success", summary: mode === "create" ? "등록 완료" : "수정 완료", detail: `${values.productName} 상품을 저장했습니다.` });
      router.push(ROUTES.products);
    });
  };

  return (
    <form className="panel product-form" onSubmit={handleSubmit} noValidate aria-label={mode === "create" ? "상품 등록" : "상품 수정"}>
      <ol className="stepper" aria-label="등록 단계">
        {PRODUCT_FORM_STEPS.map((step, index) => (
          <li
            key={step.key}
            className={`stepper-item${index === stepIndex ? " stepper-item-active" : ""}${index < stepIndex ? " stepper-item-done" : ""}`}
            aria-current={index === stepIndex ? "step" : undefined}
          >
            <span className="stepper-number">{index + 1}</span>
            <span className="stepper-label">{step.label}</span>
          </li>
        ))}
      </ol>
      <ErrorSummary error={saveError} />
      <fieldset className="product-form-step" disabled={saving}>
        <legend className="product-form-legend">
          {stepIndex + 1}. {PRODUCT_FORM_STEPS[stepIndex].label}
        </legend>
        <Step values={values} errors={errors} onChange={handleChange} />
      </fieldset>
      <div className="form-actions">
        <Link className="link-button" href={ROUTES.products}>
          취소
        </Link>
        {stepIndex > 0 && <Button type="button" label="이전" outlined disabled={saving} onClick={() => setStepKey(STEP_KEYS[stepIndex - 1])} />}
        <Button type="submit" label={isLast ? (mode === "create" ? "등록" : "저장") : "다음"} loading={saving} disabled={saving} />
      </div>
    </form>
  );
}

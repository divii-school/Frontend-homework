"use client";

import { useRouter } from "next/navigation";
import { Button } from "primereact/button";
import { useState, type FormEvent } from "react";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { ErrorSummary } from "@/components/common/ErrorSummary";
import { BasicStep, CategoryStep, MediaStep, PriceStep, type StepProps } from "@/components/products/ProductFormSteps";
import { useToast } from "@/components/providers/ToastProvider";
import { PRODUCT_FORM_STEPS } from "@/constants/products";
import { ROUTES } from "@/constants/routes";
import { useUrlParam } from "@/hooks/useUrlParam";
import type { ApiError } from "@/types/api";
import type { ProductFormErrors, ProductFormValues, ProductImage, ProductRequest } from "@/types/product";
import { firstInvalidStep, toProductRequest, validateStep } from "@/utils/product-rules";

const STEP_KEYS = PRODUCT_FORM_STEPS.map((step) => step.key);

/** id of the form, so the 저장 button in the page heading (edit mode, design 8.1.2) can submit it from outside. */
export const PRODUCT_FORM_ID = "product-form";
/** Value of that heading button: save the whole form from any step. */
export const SAVE_ALL = "save-all";
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
  // Design 8.1.1, rule 16: 취소 asks before the typed values are thrown away.
  const [leaving, setLeaving] = useState(false);
  const stepIndex = STEP_KEYS.indexOf(stepKey);
  const isLast = stepIndex === STEP_KEYS.length - 1;
  const Step = STEP_COMPONENTS[stepIndex];

  // Typing in a field removes that field's error at once. A new 수량 or 단가 replaces a saved price with 수량 × 단가.
  const handleChange = (changes: Partial<ProductFormValues>) => {
    const resetsPrice = "quantity" in changes || "unitPrice" in changes;
    setValues((current) => ({ ...current, ...changes, ...(resetsPrice ? { storedPrice: null } : {}) }));
    setErrors((current) => {
      const next = { ...current };
      (Object.keys(changes) as (keyof ProductFormValues)[]).forEach((key) => delete next[key]);
      return next;
    });
  };

  // Images change through an updater, so an upload that ends after a removal adds to the list as it is then.
  const handleImagesChange = (update: (images: ProductImage[]) => ProductImage[]) => {
    setValues((current) => ({ ...current, images: update(current.images) }));
    setErrors((current) => {
      const next = { ...current };
      delete next.images;
      return next;
    });
  };

  // "Next" checks the step on screen. "Back" never checks: the user must always be able to go back.
  const goNext = () => {
    const stepErrors = validateStep(stepIndex, values);
    setErrors(stepErrors);
    if (Object.keys(stepErrors).length === 0) setStepKey(STEP_KEYS[stepIndex + 1]);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // The heading's 저장 (edit mode) saves from any step; inside the form, 다음 moves on until the last step.
    const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
    if (!isLast && submitter?.value !== SAVE_ALL) {
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
    <form id={PRODUCT_FORM_ID} className="panel product-form" onSubmit={handleSubmit} noValidate aria-label={mode === "create" ? "상품 등록" : "상품 수정"}>
      <ol className="stepper" aria-label={mode === "create" ? "등록 단계" : "수정 단계"}>
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
        <Step mode={mode} values={values} errors={errors} onChange={handleChange} onImagesChange={handleImagesChange} />
      </fieldset>
      <div className="form-actions">
        <Button type="button" className="button-cancel" label="취소" outlined disabled={saving} onClick={() => setLeaving(true)} />
        {stepIndex > 0 && <Button type="button" label="이전" outlined disabled={saving} onClick={() => setStepKey(STEP_KEYS[stepIndex - 1])} />}
        {/* When editing, the last step has no button of its own: 저장 is in the page heading (design 8.1.2). */}
        {!(isLast && mode === "edit") && <Button type="submit" label={isLast ? "등록" : "다음"} loading={saving} disabled={saving} />}
      </div>
      <ConfirmDialog
        visible={leaving}
        title="취소"
        confirmLabel="예"
        cancelLabel="아니오"
        danger={false}
        pending={false}
        error={null}
        onConfirm={() => router.push(ROUTES.products)}
        onCancel={() => setLeaving(false)}
      >
        <p>입력하신 내용이 전부 삭제됩니다. 취소하시겠습니까?</p>
      </ConfirmDialog>
    </form>
  );
}

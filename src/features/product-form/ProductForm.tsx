"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Dialog } from "primereact/dialog";
import { PageHeader } from "@/components/layout/PageHeader";
import { useSaveProduct } from "@/hooks/useProductForm";
import { useToast } from "@/providers/ToastProvider";
import { errorMessage } from "@/lib/errors";
import type { ProductFormValues } from "@/types/productForm";
import btn from "@/components/ui/Button.module.scss";
import { Field, TextInput } from "./Field";
import { ImageUploader } from "./ImageUploader";
import { CategoryPicker } from "./CategoryPicker";
import { LIMITS, STEPS, firstInvalidStep, validateStep, type FieldErrors, type StepIndex } from "./validation";
import styles from "./ProductForm.module.scss";

interface Props {
  mode: "create" | "edit";
  productId: number | null;
  initialValues: ProductFormValues;
}

const LIST_PATH = "/shopping/products";

/**
 * Figma 8.1.1 (register) / 8.1.2 (edit) as a 4-step form.
 * - One `values` object lives here, so Back / Next never lose input.
 * - Each step is validated when leaving it; errors show only after that attempt.
 * - A failed save keeps everything and shows the API's message.
 */
export function ProductForm({ mode, productId, initialValues }: Props) {
  const router = useRouter();
  const { notify } = useToast();
  const save = useSaveProduct(productId);

  const [values, setValues] = useState<ProductFormValues>(initialValues);
  const [step, setStep] = useState<StepIndex>(0);
  const [attempted, setAttempted] = useState<ReadonlySet<StepIndex>>(new Set());
  const [extraErrors, setExtraErrors] = useState<FieldErrors>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const keepEditingRef = useRef<HTMLButtonElement>(null);
  const dirty = useRef(false);

  // Warn before closing the tab with unsaved changes.
  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (dirty.current && !save.isSuccess) e.preventDefault();
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [save.isSuccess]);

  const stepErrors = attempted.has(step) ? { ...validateStep(step, values), ...extraErrors } : extraErrors;

  function set<K extends keyof ProductFormValues>(key: K, value: ProductFormValues[K]) {
    dirty.current = true;
    setValues((v) => ({ ...v, [key]: value }));
    setApiError(null);
    if (extraErrors[key]) setExtraErrors((e) => ({ ...e, [key]: undefined }));
  }

  function goTo(next: StepIndex) {
    setStep(next);
    setExtraErrors({});
    // Move focus to the step heading so keyboard / screen-reader users land at the new step.
    requestAnimationFrame(() => headingRef.current?.focus());
  }

  async function next(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAttempted((a) => new Set(a).add(step));
    if (Object.keys(validateStep(step, values)).length) return;

    if (step < 3) {
      goTo((step + 1) as StepIndex);
      return;
    }

    // Last step: re-check every step, then save.
    const invalid = firstInvalidStep(values);
    if (invalid !== null) {
      setAttempted(new Set([0, 1, 2, 3]));
      goTo(invalid);
      return;
    }
    try {
      await save.mutateAsync(values);
      dirty.current = false;
      notify("success", mode === "create" ? `“${values.productName.trim()}” was registered.` : `Saved “${values.productName.trim()}”.`);
      router.push(LIST_PATH);
    } catch (error) {
      setApiError(errorMessage(error));
    }
  }

  const busy = save.isPending;
  const title = mode === "create" ? "Product Registration" : "Edit Product";

  return (
    <>
      <PageHeader title={title} crumb={title} />

      <div className={styles.content}>
        <ol className={styles.stepper} aria-label="Steps">
          {STEPS.map((s, i) => (
            <li key={s.key} className={`${styles["step-item"]} ${i === step ? styles["step-current"] : ""} ${i < step ? styles["step-done"] : ""}`}>
              <span className={styles["step-number"]} aria-hidden>
                {i + 1}
              </span>
              <span className={styles["step-label"]}>{s.label}</span>
              {i === step && <span className="visually-hidden"> (current step)</span>}
            </li>
          ))}
        </ol>

        <form className={styles.card} onSubmit={next} noValidate aria-busy={busy}>
          <h2 ref={headingRef} tabIndex={-1} className={styles["step-heading"]}>
            Step {step + 1} of {STEPS.length}: {STEPS[step].label}
          </h2>

          {step === 0 && (
            <div className={styles.grid}>
              <Field label="Product Name" required error={stepErrors.productName}>
                {(f) => (
                  <TextInput {...f} value={values.productName} onChange={(v) => set("productName", v)} placeholder="Product Name" maxLength={LIMITS.NAME_MAX + 20} />
                )}
              </Field>
              <Field label="Product Code" error={stepErrors.productCode} hint="Generated automatically.">
                {(f) => <TextInput {...f} value={values.productCode} readOnly />}
              </Field>
              <Field label="Unit Price" required error={stepErrors.unitPrice}>
                {(f) => <TextInput {...f} money value={values.unitPrice} onChange={(v) => set("unitPrice", v)} placeholder="0" maxLength={12} />}
              </Field>
              <Field label="Selling Price" required error={stepErrors.price} hint="The price the customer pays.">
                {(f) => <TextInput {...f} money value={values.price} onChange={(v) => set("price", v)} placeholder="0" maxLength={12} />}
              </Field>
              <div className={styles.full}>
                <Field label="Detailed Description" required error={stepErrors.description}>
                  {(f) => (
                    <textarea
                      id={f.id}
                      className={`${styles.textarea} ${f.invalid ? styles.invalid : ""}`}
                      value={values.description}
                      onChange={(e) => set("description", e.target.value)}
                      placeholder="Enter the product description."
                      rows={8}
                      maxLength={LIMITS.DESCRIPTION_MAX + 50}
                      aria-invalid={f.invalid}
                      aria-describedby={f.describedBy}
                      aria-required
                    />
                  )}
                </Field>
              </div>
            </div>
          )}

          {step === 1 && (
            <div>
              <p className={styles.label} id="images-label">
                Images<span className={styles.required} aria-hidden>*</span>
              </p>
              <ImageUploader images={values.images} onChange={(images) => set("images", images)} error={stepErrors.images} />
            </div>
          )}

          {step === 2 && (
            <div className={styles.stack}>
              <div className={styles.grid}>
                <Field label="Exposure Status" required hint="Show the product to customers.">
                  {(f) => (
                    <select id={f.id} className={styles.select} value={values.isVisible} onChange={(e) => set("isVisible", e.target.value as "yes" | "no")} aria-describedby={f.describedBy}>
                      <option value="yes">Yes</option>
                      <option value="no">No</option>
                    </select>
                  )}
                </Field>
                <Field label="Sales Status" required hint="When No, the product can't be paid for.">
                  {(f) => (
                    <select id={f.id} className={styles.select} value={values.onSale} onChange={(e) => set("onSale", e.target.value as "yes" | "no")} aria-describedby={f.describedBy}>
                      <option value="yes">Yes</option>
                      <option value="no">No</option>
                    </select>
                  )}
                </Field>
              </div>
              <div>
                <p className={styles.label}>
                  Registration Category<span className={styles.required} aria-hidden>*</span>
                </p>
                <CategoryPicker
                  categoryId={values.categoryId}
                  subCategoryId={values.subCategoryId}
                  childCategoryId={values.childCategoryId}
                  onChange={(c) => {
                    dirty.current = true;
                    setValues((v) => ({ ...v, ...c }));
                  }}
                  errors={stepErrors}
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className={styles.grid}>
              <div className={styles.full}>
                <Field label="ERP Code" hint="Assigned by the server; it can't be entered or changed here.">
                  {(f) => <TextInput {...f} value={values.erpCode || (mode === "create" ? "Assigned automatically after registration" : "-")} readOnly />}
                </Field>
              </div>
              <Field label="Product ERP Name" required error={stepErrors.erpName}>
                {(f) => <TextInput {...f} value={values.erpName} onChange={(v) => set("erpName", v)} placeholder="Please enter the product name" maxLength={LIMITS.ERP_TEXT_MAX + 10} />}
              </Field>
              <Field label="Quantity" required error={stepErrors.quantity}>
                {(f) => <TextInput {...f} numeric value={values.quantity} onChange={(v) => set("quantity", v)} placeholder="1" maxLength={9} />}
              </Field>
              <Field label="Tax Exemption" required error={stepErrors.taxType}>
                {(f) => (
                  <select
                    id={f.id}
                    className={`${styles.select} ${f.invalid ? styles.invalid : ""}`}
                    value={values.taxType}
                    onChange={(e) => set("taxType", e.target.value as ProductFormValues["taxType"])}
                    aria-invalid={f.invalid}
                    aria-describedby={f.describedBy}
                    aria-required
                  >
                    <option value="">Select tax type</option>
                    <option value="tax">Taxable</option>
                    <option value="tax_free">Tax-free</option>
                  </select>
                )}
              </Field>
              <Field label="ERP Unit Price" required error={stepErrors.erpUnitPrice}>
                {(f) => <TextInput {...f} money value={values.erpUnitPrice} onChange={(v) => set("erpUnitPrice", v)} placeholder="0" maxLength={12} />}
              </Field>
            </div>
          )}

          {apiError && (
            <p className={styles["api-error"]} role="alert">
              {apiError} 입력한 내용은 그대로 남아 있습니다.
            </p>
          )}

          <div className={styles.footer}>
            <button type="button" className={`${btn.button} ${btn.outline}`} onClick={() => setConfirmCancel(true)} disabled={busy}>
              Cancel
            </button>
            <div className={styles["footer-right"]}>
              {step > 0 && (
                <button type="button" className={`${btn.button} ${btn.outline}`} onClick={() => goTo((step - 1) as StepIndex)} disabled={busy}>
                  Back
                </button>
              )}
              <button type="submit" className={`${btn.button} ${btn.primary}`} disabled={busy} aria-busy={busy}>
                {step < 3 ? "Next" : busy ? "Saving…" : mode === "create" ? "Register" : "Save"}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Figma 8.1.1 #21: confirm before throwing the input away. */}
      <Dialog
        visible={confirmCancel}
        header="Cancel?"
        onHide={() => setConfirmCancel(false)}
        draggable={false}
        resizable={false}
        pt={{ root: { role: "alertdialog" } }}
        focusOnShow={false}
        onShow={() => keepEditingRef.current?.focus()}
        footer={
          <>
            <button type="button" ref={keepEditingRef} className={`${btn.button} ${btn.outline}`} onClick={() => setConfirmCancel(false)}>
              No
            </button>
            <button
              type="button"
              className={`${btn.button} ${btn.primary}`}
              onClick={() => {
                dirty.current = false;
                router.push(LIST_PATH);
              }}
            >
              Yes
            </button>
          </>
        }
      >
        <p className={styles["dialog-text"]}>All entered information will be deleted. Do you want to cancel?</p>
      </Dialog>
    </>
  );
}

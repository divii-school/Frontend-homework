"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { FormProvider, useForm, useFormContext, useFormState, useWatch, type FieldErrors } from "react-hook-form";
import { Button } from "primereact/button";
import { toApiError } from "@/api-services/CoreAPIService";
import type { ProductDetails } from "@/api-services/ProductService.types";
import { ROUTE_KEYS } from "@/config/navigation";
import { useGetGeneratedProductCode } from "@/hooks/API/products/useGetGeneratedProductCode";
import { useAddProduct, useEditProduct } from "@/hooks/API/products/useProductMutations";
import { useCan } from "@/hooks/useCan";
import { useToast } from "@/providers/ToastProvider";
import type { ApiError } from "@/types/api";
import { formatDateTime } from "@/utils/format";
import ProductFormStepper from "./ProductFormStepper";
import StepBasicInfo from "./StepBasicInfo";
import StepImagesStatus from "./StepImagesStatus";
import StepCategoryOptions, { type LockedCategory } from "./StepCategoryOptions";
import StepErpReview from "./StepErpReview";
import { clearDraft, draftStorageKey, DRAFT_SAVE_DELAY_MS, readDraft, saveDraft, serverVersionOf } from "./product-form-draft";
import {
  EMPTY_PRODUCT_VALUES,
  FORM_MESSAGES,
  LAST_STEP,
  STEP_FIELDS,
  STEPS,
  SINGLE_VOLUME,
  fieldErrorsFromApi,
  keptOptionSets,
  parseStep,
  stepOfField,
  toPayload,
  valuesFromDetails,
  type FormMode,
  type ProductFormValues,
  type StepNumber,
} from "./product-form.model";
import { confirmLeave, useLeaveGuard } from "./useLeaveGuard";

interface ProductFormProps {
  mode: FormMode;
  /** Edit mode: the loaded product (GET /products/details/:id). */
  product?: ProductDetails;
}

const LIST_HREF = "/shopping-mall/products";

type FocusRequest = { step: StepNumber; target: "heading" | "invalid" | "alert" } | null;

// Saves the form to sessionStorage 0.5 s after the last change — only once the user changed something.
// A tiny child component, so only it re-renders on every keystroke (not the whole form).
function DraftAutosave({ storageKey, baseVersion, disabled }: { storageKey: string; baseVersion?: string; disabled: boolean }) {
  const { control, getValues } = useFormContext<ProductFormValues>();
  const values = useWatch({ control });
  const { isDirty } = useFormState({ control });

  useEffect(() => {
    if (disabled || !isDirty) return;
    const timer = window.setTimeout(() => saveDraft(storageKey, getValues(), baseVersion), DRAFT_SAVE_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [values, isDirty, disabled, storageKey, baseVersion, getValues]);

  return null;
}

// =====================================================================================
// Product registration / edit (design 8.1.1 / 8.1.2) as a 4-step form.
//
// How the values survive moving between steps:
//  - ONE react-hook-form `useForm` here holds every field of all four steps.
//  - All four step sections are always rendered inside the one <form>; only the current one is
//    visible (`hidden`). Nothing unmounts, so Back / Next never loses a value.
//  - "Next" runs `trigger(STEP_FIELDS[step])` = the rules of the current step only.
//  - The current step is `?step=1..4` in the URL; a later step can't be opened before the steps
//    before it pass validation (stepper, URL edit or reload).
//  - A draft is kept in sessionStorage (reload-safe) and removed after a successful save / Cancel.
//    An edit draft is restored only while the product on the server is still the copy it was started from.
//  - An API error never clears anything: field errors go back to their field (and step marker),
//    every other error is shown on the review step + toast.
// =====================================================================================
export default function ProductForm({ mode, product }: ProductFormProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const toast = useToast();
  const canSave = useCan(ROUTE_KEYS.PRODUCTS, mode === "create" ? "create" : "update");
  const addProduct = useAddProduct();
  const editProduct = useEditProduct();
  // Create: the same code query step 1 shows (one request); fetched again right before the POST
  const codeQuery = useGetGeneratedProductCode(mode === "create");

  // ---- The one form ----
  const initialValues = useMemo(() => (product ? valuesFromDetails(product) : EMPTY_PRODUCT_VALUES), [product]);
  const form = useForm<ProductFormValues>({ mode: "onTouched", defaultValues: initialValues });
  const {
    handleSubmit,
    trigger,
    reset,
    setError,
    clearErrors,
    setValue,
    getValues,
    formState: { errors, isDirty, isSubmitting },
  } = form;

  // ---- Screen state ----
  const storageKey = draftStorageKey(mode, product?.id);
  // Edit: which server copy this form started from (create: nothing). Read ONCE — when `product` is fetched
  // again later, the values in the form still come from the first copy.
  const [baseVersion] = useState(() => (product ? serverVersionOf(product) : undefined));
  const step = parseStep(searchParams.get("step"));
  const [unlocked, setUnlocked] = useState<StepNumber>(mode === "edit" ? LAST_STEP : 1);
  const [draftChecked, setDraftChecked] = useState(false);
  const [draftSavedAt, setDraftSavedAt] = useState<number | null>(null);
  const [draftOutdated, setDraftOutdated] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [done, setDone] = useState(false); // saved or left on purpose → no more draft / leave guard
  const formRef = useRef<HTMLFormElement>(null);
  const focusRequest = useRef<FocusRequest>(null);
  const [focusTick, setFocusTick] = useState(0);

  const lockedCategory: LockedCategory | undefined =
    product && product.category && product.subCategory && product.childCategory
      ? { category: product.category, subCategory: product.subCategory, childCategory: product.childCategory }
      : undefined;
  const keptOptionCount = keptOptionSets(product).reduce((count, set) => count + set.option.length, 0);
  const hadSingleOptions = (product?.productOptions ?? []).some((set) => set.type === SINGLE_VOLUME);

  // Steps with an error (client rule or API) → red marker in the stepper and the review
  const errorSteps = STEPS.map(({ step: number }) => number).filter((number) =>
    STEP_FIELDS[number].some((field) => Boolean(errors[field])),
  );

  // ---- Step navigation (URL ?step=) ----
  // history.pushState is enough: Next.js keeps useSearchParams in sync with it, and unlike
  // router.push it doesn't ask the server for the page again on every step.
  const showStep = useCallback(
    (next: StepNumber, target: "heading" | "invalid" | "alert", replace = false) => {
      focusRequest.current = { step: next, target };
      setFocusTick((tick) => tick + 1);
      if (next === step) return;
      const params = new URLSearchParams(searchParams.toString());
      params.set("step", String(next));
      const href = `${pathname}?${params.toString()}`;
      if (replace) window.history.replaceState(null, "", href);
      else window.history.pushState(null, "", href);
    },
    [step, searchParams, pathname],
  );

  /**
   * Rules of one step only. Images still uploading count as "not ready".
   * When the step fails, its fields are marked "touched": from then on each error disappears while the
   * user types (not only when the field loses focus — that late jump could move the Next button away
   * from under the mouse and swallow the click).
   */
  const validateStep = useCallback(
    async (number: StepNumber) => {
      if (number === 2 && uploading) {
        setError("images", { type: "uploading", message: FORM_MESSAGES.imagesUploading });
        return false;
      }
      const valid = await trigger(STEP_FIELDS[number]);
      if (!valid) {
        STEP_FIELDS[number]
          .filter((name) => name !== "options") // option rows are a field array; their inputs re-check on their own
          .forEach((name) => setValue(name, getValues(name), { shouldTouch: true }));
      }
      return valid;
    },
    [uploading, setError, trigger, setValue, getValues],
  );

  /** Back: always. Forward: every step from the current one up to the target must pass. */
  const goToStep = async (target: StepNumber) => {
    if (target <= step) {
      showStep(target, "heading");
      return;
    }
    for (let number = step; number < target; number = (number + 1) as StepNumber) {
      if (!(await validateStep(number))) {
        showStep(number, "invalid");
        return;
      }
    }
    setUnlocked((current) => (target > current ? target : current));
    showStep(target, "heading");
  };

  // Move focus after the step is on screen: its heading, the first invalid field, or the error box
  useEffect(() => {
    const request = focusRequest.current;
    if (!request || request.step !== step) return;
    const section = formRef.current?.querySelector<HTMLElement>(`[data-step="${step}"]`);
    const selector = request.target === "invalid" ? '[aria-invalid="true"]' : request.target === "alert" ? "[data-submit-error]" : "h2";
    const element = section?.querySelector<HTMLElement>(selector);
    if (!element) return; // not rendered yet → the next render tries again
    focusRequest.current = null;
    element.focus();
  }, [focusTick, step, errors, submitError]);

  // ---- Draft: restore once on load (never again, e.g. when the edit page's product is refetched) ----
  useEffect(() => {
    if (draftChecked) return;
    const draft = readDraft(storageKey, initialValues);
    if (draft && draft.baseVersion !== baseVersion) {
      // Edit only (a create draft has no version on either side): the product was changed on the server
      // after the draft was saved. Restoring would put the old values over the newer data → drop the draft
      // and tell the user why.
      clearDraft(storageKey);
      setDraftOutdated(true);
    } else if (draft) {
      // keepDefaultValues → the restored values count as "changed" (isDirty), so the leave guard is on
      reset(draft.values, { keepDefaultValues: true });
      setDraftSavedAt(draft.savedAt);
    }
    setDraftChecked(true);
  }, [draftChecked, storageKey, initialValues, baseVersion, reset]);

  // ---- URL guard: ?step=3 on reload / typed URL / browser history → steps 1..2 must be valid ----
  useEffect(() => {
    if (!draftChecked || step <= unlocked) return;
    let cancelled = false;
    void (async () => {
      for (let number = 1 as StepNumber; number < step; number = (number + 1) as StepNumber) {
        const ok = await validateStep(number);
        if (cancelled) return;
        if (!ok) {
          showStep(number, "invalid", true);
          return;
        }
      }
      if (!cancelled) setUnlocked(step);
    })();
    return () => {
      cancelled = true;
    };
  }, [draftChecked, step, unlocked, validateStep, showStep]);

  const discardDraft = () => {
    clearDraft(storageKey);
    reset();
    setDraftSavedAt(null);
    setSubmitError(null);
    setUnlocked(mode === "edit" ? LAST_STEP : 1);
    showStep(1, "heading", true);
  };

  // ---- Leaving: Cancel button, links, tab close ----
  const leave = useCallback(() => {
    setDone(true);
    clearDraft(storageKey);
  }, [storageKey]);
  useLeaveGuard(isDirty && !done, leave);

  const exitHref = mode === "edit" && product ? `${LIST_HREF}/details/${product.id}` : LIST_HREF;
  const cancel = async () => {
    if (isDirty && !(await confirmLeave())) return;
    leave();
    router.push(exitHref);
  };

  // ---- Submit ----
  const showApiError = (error: ApiError) => {
    const fields = fieldErrorsFromApi(error);
    fields.forEach(({ field, message }) => setError(field, { type: "server", message }));
    setSubmitError(error.message);
    toast.error(mode === "create" ? "The product was not registered" : "The changes were not saved", error.message);
    if (fields.length > 0) {
      // Back to the field the API complained about (its step gets the red marker)
      const first = Math.min(...fields.map(({ field }) => stepOfField(field))) as StepNumber;
      showStep(first, "invalid");
    } else {
      showStep(LAST_STEP, "alert");
    }
  };

  const onValid = async (values: ProductFormValues) => {
    if (done) return; // already saved: the next page is loading, never send a second request
    if (uploading) {
      setSubmitError(FORM_MESSAGES.imagesUploading);
      showStep(LAST_STEP, "alert");
      return;
    }
    setSubmitError(null);
    try {
      const payload = toPayload(values, product);
      if (mode === "edit" && product) await editProduct.mutateAsync({ id: product.id, payload });
      else {
        // A fresh code right before the POST: the one on screen may have been taken by another product meanwhile
        const productCode = (await codeQuery.refetch({ throwOnError: true })).data ?? values.productCode.trim();
        setValue("productCode", productCode);
        await addProduct.mutateAsync({ ...payload, productCode });
      }
      leave();
      toast.success(mode === "create" ? "Product registered" : "Product saved", payload.productName);
      router.push(mode === "create" ? LIST_HREF : exitHref);
    } catch (error) {
      showApiError(toApiError(error));
    }
  };

  const onInvalid = (formErrors: FieldErrors<ProductFormValues>) => {
    const first = STEPS.find(({ step: number }) => STEP_FIELDS[number].some((field) => Boolean(formErrors[field])));
    showStep(first ? first.step : step, "invalid");
  };

  // Enter in a field or the main button: steps 1–3 → Next, step 4 → Register / Save
  const onFormSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (step < LAST_STEP) {
      void goToStep((step + 1) as StepNumber);
      return;
    }
    clearErrors(); // old API errors go; every rule runs again
    void handleSubmit(onValid, onInvalid)();
  };

  const submitLabel = mode === "create" ? "Register" : "Save";

  return (
    <FormProvider {...form}>
      <DraftAutosave storageKey={storageKey} baseVersion={baseVersion} disabled={done} />
      <section className="content-card product-form-card" aria-label={mode === "create" ? "Product registration form" : "Product edit form"}>
        <ProductFormStepper current={step} unlocked={unlocked} errorSteps={errorSteps} onSelect={(target) => void goToStep(target)} />

        {/* Draft notice */}
        {draftSavedAt !== null && (
          <div className="product-form-notice" role="status">
            <i className="pi pi-history" aria-hidden="true" />
            <span>Draft restored (saved {formatDateTime(draftSavedAt)}).</span>
            <Button type="button" label="Discard" text size="small" className="product-form-notice-action" onClick={discardDraft} />
          </div>
        )}

        {/* Edit: a draft was found but the product changed on the server meanwhile → it was not restored */}
        {draftOutdated && (
          <div className="product-form-notice" role="status">
            <i className="pi pi-info-circle" aria-hidden="true" />
            <span className="product-form-notice-text">{FORM_MESSAGES.draftOutdated}</span>
          </div>
        )}

        {!canSave && (
          <p className="product-form-alert" role="alert">
            Your account cannot {mode === "create" ? "register" : "edit"} products.
          </p>
        )}

        <form ref={formRef} className="product-form" noValidate onSubmit={onFormSubmit}>
          {/* Step 1 — Basic info */}
          <section data-step={1} hidden={step !== 1} className="product-form-step" aria-labelledby="product-step-1-title">
            <h2 id="product-step-1-title" className="product-form-step-title" tabIndex={-1}>
              1. Basic info
            </h2>
            <StepBasicInfo mode={mode} />
          </section>

          {/* Step 2 — Images & status */}
          <section data-step={2} hidden={step !== 2} className="product-form-step" aria-labelledby="product-step-2-title">
            <h2 id="product-step-2-title" className="product-form-step-title" tabIndex={-1}>
              2. Images &amp; status
            </h2>
            <StepImagesStatus onUploadingChange={setUploading} />
          </section>

          {/* Step 3 — Category & options */}
          <section data-step={3} hidden={step !== 3} className="product-form-step" aria-labelledby="product-step-3-title">
            <h2 id="product-step-3-title" className="product-form-step-title" tabIndex={-1}>
              3. Category &amp; options
            </h2>
            <StepCategoryOptions
              lockedCategory={lockedCategory}
              productId={product?.id}
              keptOptionCount={keptOptionCount}
              hadOptions={hadSingleOptions}
              allowEmptyOptions={mode === "edit" && Boolean(product?.isOptions) && initialValues.options.length === 0}
            />
          </section>

          {/* Step 4 — ERP & review (+ the API error box) */}
          <section data-step={4} hidden={step !== 4} className="product-form-step" aria-labelledby="product-step-4-title">
            <h2 id="product-step-4-title" className="product-form-step-title" tabIndex={-1}>
              4. ERP &amp; review
            </h2>
            {submitError && (
              <div className="product-form-alert" role="alert" tabIndex={-1} data-submit-error>
                <i className="pi pi-exclamation-circle" aria-hidden="true" />
                <div>
                  <strong>{mode === "create" ? "The product was not registered." : "The changes were not saved."}</strong>{" "}
                  {submitError} Everything you entered is kept — fix it and press {submitLabel} again.
                </div>
              </div>
            )}
            <StepErpReview
              mode={mode}
              erpCode={product?.erpCode}
              lockedCategory={lockedCategory}
              keptOptionCount={keptOptionCount}
              errorSteps={errorSteps}
              onEditStep={(target) => void goToStep(target)}
            />
          </section>

          {/* Footer: Cancel on the left, Back / Next / Register on the right */}
          <div className="product-form-footer">
            <Button type="button" label="Cancel" outlined className="product-form-cancel" onClick={() => void cancel()} />
            <div className="product-form-footer-nav">
              {step > 1 && (
                <Button
                  type="button"
                  label="Back"
                  icon="pi pi-arrow-left"
                  outlined
                  onClick={() => void goToStep((step - 1) as StepNumber)}
                />
              )}
              {step < LAST_STEP ? (
                <Button type="submit" label="Next" icon="pi pi-arrow-right" iconPos="right" />
              ) : (
                <Button
                  type="submit"
                  label={submitLabel}
                  icon="pi pi-check"
                  loading={isSubmitting}
                  disabled={!canSave || uploading || isSubmitting || done}
                />
              )}
            </div>
          </div>
        </form>
      </section>
    </FormProvider>
  );
}

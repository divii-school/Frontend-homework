"use client";

import { Controller, useFormContext, useWatch } from "react-hook-form";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Button } from "primereact/button";
import {
  useGetPickerCategories,
  useGetPickerChildCategories,
  useGetPickerSubCategories,
} from "@/hooks/API/products/useProductPickers";
import { EMPTY_VALUE, formatNumber, formatWon } from "@/utils/format";
import FormField from "./FormField";
import MoneyInput from "./MoneyInput";
import type { LockedCategory } from "./StepCategoryOptions";
import {
  FORM_LIMITS,
  FORM_MESSAGES,
  STEPS,
  TAX_TYPE_OPTIONS,
  YES_NO_OPTIONS,
  type FormMode,
  type ProductFormValues,
  type StepNumber,
} from "./product-form.model";

interface StepErpReviewProps {
  mode: FormMode;
  /** Edit: the product's ERP code (read-only). */
  erpCode?: string;
  lockedCategory?: LockedCategory;
  keptOptionCount: number;
  /** Steps that currently have errors (red "Fix" note in the summary). */
  errorSteps: StepNumber[];
  onEditStep: (step: StepNumber) => void;
}

const yesNoLabel = (value: string | null) => YES_NO_OPTIONS.find((option) => option.value === value)?.label ?? EMPTY_VALUE;

// Step 4 — ERP & review (design 8.1.1 #16–20 / 8.1.2 #12–16), then a summary of all four steps with
// an "Edit" button per step (goes back without losing anything) above the final Register / Save.
export default function StepErpReview({ mode, erpCode, lockedCategory, keptOptionCount, errorSteps, onEditStep }: StepErpReviewProps) {
  const { control, register, formState: { errors } } = useFormContext<ProductFormValues>();
  const values = useWatch({ control }) as ProductFormValues;

  // Category names for the summary (same cached lists as step 3 → no extra request)
  const categories = useGetPickerCategories();
  const subCategories = useGetPickerSubCategories(lockedCategory ? null : values.categoryId);
  const childCategories = useGetPickerChildCategories(lockedCategory ? null : values.subCategoryId);
  const nameOf = (list: Array<{ id: number; name: string }> | undefined, id: number | null) =>
    id === null ? EMPTY_VALUE : (list?.find((item) => item.id === id)?.name ?? `#${id}`);
  const categoryPath = lockedCategory
    ? [lockedCategory.category, lockedCategory.subCategory, lockedCategory.childCategory].map((level) => level?.name ?? EMPTY_VALUE).join(" > ")
    : [
        nameOf(categories.data, values.categoryId),
        nameOf(subCategories.data, values.subCategoryId),
        nameOf(childCategories.data, values.childCategoryId),
      ].join(" > ");

  const summary: Record<StepNumber, Array<[string, string]>> = {
    1: [
      ["Product name", values.productName?.trim() || EMPTY_VALUE],
      ["Product code", values.productCode || EMPTY_VALUE],
      ["Unit price", formatWon(values.price)],
      ["Selling price", formatWon(values.unitPrice)],
      ["Detailed description", values.description?.trim() || EMPTY_VALUE],
    ],
    2: [
      ["Images", `${values.images?.length ?? 0} image${values.images?.length === 1 ? "" : "s"}`],
      ["Exposure status", yesNoLabel(values.isVisible)],
      ["Sales status", yesNoLabel(values.onSale)],
    ],
    3: [
      ["Category", categoryPath],
      [
        "Options",
        values.options?.length
          ? values.options.map((row) => `${row.optionName} (${formatWon(row.price)})`).join(", ")
          : keptOptionCount > 0
            ? `${keptOptionCount} category option(s) kept`
            : "None",
      ],
      ["Required option for purchase", values.optionsRequired ? "Yes" : "No"],
    ],
    4: [
      ["ERP code", mode === "create" ? "Assigned automatically" : erpCode || EMPTY_VALUE],
      ["ERP product name", values.erpName?.trim() || EMPTY_VALUE],
      ["Quantity", values.quantity === null ? EMPTY_VALUE : `${formatNumber(values.quantity)} pcs`],
      ["Tax type", TAX_TYPE_OPTIONS.find((option) => option.value === values.taxType)?.label ?? EMPTY_VALUE],
      ["ERP unit price", formatWon(values.erpUnitPrice)],
    ],
  };

  return (
    <>
      {/* ERP fields */}
      <div className="product-form-grid">
        <FormField
          id="product-erp-code"
          label="ERP code"
          hint={mode === "create" ? "The server assigns the next free ERP code when the product is registered." : "The ERP code cannot be changed."}
        >
          {(field) => <InputText {...field} readOnly value={mode === "create" ? "Assigned automatically" : erpCode || EMPTY_VALUE} />}
        </FormField>

        <FormField id="product-erp-name" label="ERP product name" required error={errors.erpName?.message}>
          {(field) => (
            <InputText
              {...field}
              placeholder="ERP product name"
              autoComplete="off"
              {...register("erpName", {
                validate: (value) => {
                  const trimmed = value.trim();
                  if (!trimmed) return FORM_MESSAGES.erpNameRequired;
                  if (trimmed.length > FORM_LIMITS.erpNameMax) return FORM_MESSAGES.erpNameTooLong;
                  return true;
                },
              })}
            />
          )}
        </FormField>

        <Controller
          control={control}
          name="quantity"
          rules={{
            validate: (value) => {
              if (value === null) return FORM_MESSAGES.quantityRequired;
              if (value <= 0) return FORM_MESSAGES.quantityPositive;
              if (value > FORM_LIMITS.intMax) return FORM_MESSAGES.quantityTooLarge;
              return true;
            },
          }}
          render={({ field, fieldState }) => (
            <FormField id="product-quantity" label="Quantity" required error={fieldState.error?.message} hint="Number of pieces in one ERP unit.">
              {(a11y) => (
                <div className="product-form-inline">
                  <MoneyInput
                    {...a11y}
                    ref={field.ref}
                    name={field.name}
                    currency={false}
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    placeholder="1"
                  />
                  <span className="product-form-unit">pcs</span>
                </div>
              )}
            </FormField>
          )}
        />

        <Controller
          control={control}
          name="taxType"
          rules={{ validate: (value) => value !== null || FORM_MESSAGES.taxTypeRequired }}
          render={({ field, fieldState }) => (
            <FormField id="product-tax-type" label="Tax type" required error={fieldState.error?.message}>
              {({ id, className, ...aria }) => (
                <Dropdown
                  {...aria}
                  inputId={id}
                  className={className}
                  focusInputRef={field.ref}
                  value={field.value}
                  options={[...TAX_TYPE_OPTIONS]}
                  placeholder="Select taxable or tax-exempt"
                  onChange={(event) => field.onChange(event.value)}
                  onBlur={field.onBlur}
                />
              )}
            </FormField>
          )}
        />

        <Controller
          control={control}
          name="erpUnitPrice"
          rules={{
            validate: (value) => {
              if (value === null) return FORM_MESSAGES.erpUnitPriceRequired;
              if (value > FORM_LIMITS.intMax) return FORM_MESSAGES.moneyTooLarge;
              return true;
            },
          }}
          render={({ field, fieldState }) => (
            <FormField id="product-erp-unit-price" label="ERP unit price" required error={fieldState.error?.message}>
              {(a11y) => (
                <MoneyInput {...a11y} ref={field.ref} name={field.name} value={field.value} onChange={field.onChange} onBlur={field.onBlur} placeholder="₩0" />
              )}
            </FormField>
          )}
        />
      </div>

      {/* Review: everything entered so far, with a way back to each step */}
      <section className="product-review" aria-labelledby="product-review-title">
        <h3 id="product-review-title" className="product-review-title">
          Review before {mode === "create" ? "registering" : "saving"}
        </h3>
        {STEPS.map(({ step, label }) => (
          <div key={step} className={errorSteps.includes(step) ? "product-review-block product-review-block-error" : "product-review-block"}>
            <div className="product-review-head">
              <h4>
                {step}. {label}
                {errorSteps.includes(step) && <span className="product-review-fix"> — needs a fix</span>}
              </h4>
              {step !== 4 && (
                <Button type="button" label="Edit" icon="pi pi-pencil" text size="small" aria-label={`Edit step ${step}: ${label}`} onClick={() => onEditStep(step)} />
              )}
            </div>
            <dl className="product-review-list">
              {summary[step].map(([term, detail]) => (
                <div key={term} className="product-review-row">
                  <dt>{term}</dt>
                  <dd>{detail}</dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
      </section>
    </>
  );
}

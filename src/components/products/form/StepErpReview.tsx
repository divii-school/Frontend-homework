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
      ["상품명", values.productName?.trim() || EMPTY_VALUE],
      ["상품코드", values.productCode || EMPTY_VALUE],
      ["단가", formatWon(values.unitPrice)],
      ["판매가", formatWon(values.price)],
      ["상세설명", values.description?.trim() || EMPTY_VALUE],
    ],
    2: [
      ["이미지", `${values.images?.length ?? 0}장`],
      ["노출상태", yesNoLabel(values.isVisible)],
      ["판매상태", yesNoLabel(values.onSale)],
    ],
    3: [
      ["등록 카테고리", categoryPath],
      [
        "옵션",
        values.options?.length
          ? values.options.map((row) => `${row.optionName} (${formatWon(row.price)})`).join(", ")
          : keptOptionCount > 0
            ? `카테고리 옵션 ${keptOptionCount}건 유지`
            : "없음",
      ],
      ["상품 구매 필수 옵션 선택", values.optionsRequired ? "예" : "아니오"],
    ],
    4: [
      ["ERP 코드", mode === "create" ? "등록 시 자동 부여" : erpCode || EMPTY_VALUE],
      ["상품ERP명", values.erpName?.trim() || EMPTY_VALUE],
      ["갯수", values.quantity === null ? EMPTY_VALUE : `${formatNumber(values.quantity)}개`],
      ["비과세", TAX_TYPE_OPTIONS.find((option) => option.value === values.taxType)?.label ?? EMPTY_VALUE],
      ["ERP 단가", formatWon(values.erpUnitPrice)],
    ],
  };

  return (
    <>
      {/* ERP fields */}
      <div className="product-form-grid">
        <FormField
          id="product-erp-code"
          label="ERP 코드"
          hint={mode === "create" ? "ERP 코드는 상품 등록 시 서버에서 자동으로 부여됩니다." : "ERP 코드는 변경할 수 없습니다."}
        >
          {(field) => <InputText {...field} readOnly value={mode === "create" ? "등록 시 자동 부여" : erpCode || EMPTY_VALUE} />}
        </FormField>

        <FormField id="product-erp-name" label="상품ERP명" required error={errors.erpName?.message}>
          {(field) => (
            <InputText
              {...field}
              placeholder="상품명 입력해 주세요."
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
            <FormField id="product-quantity" label="갯수" required error={fieldState.error?.message} hint="ERP 1단위에 포함된 수량입니다.">
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
                  <span className="product-form-unit">개</span>
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
            <FormField id="product-tax-type" label="비과세" required error={fieldState.error?.message}>
              {({ id, className, ...aria }) => (
                <Dropdown
                  {...aria}
                  inputId={id}
                  className={className}
                  focusInputRef={field.ref}
                  value={field.value}
                  options={[...TAX_TYPE_OPTIONS]}
                  placeholder="비과세를 선택해 주세요."
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
            <FormField id="product-erp-unit-price" label="ERP 단가" required error={fieldState.error?.message}>
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
          {mode === "create" ? "등록" : "저장"} 전 입력 내용 확인
        </h3>
        {STEPS.map(({ step, label }) => (
          <div key={step} className={errorSteps.includes(step) ? "product-review-block product-review-block-error" : "product-review-block"}>
            <div className="product-review-head">
              <h4>
                {step}. {label}
                {errorSteps.includes(step) && <span className="product-review-fix"> — 수정 필요</span>}
              </h4>
              {step !== 4 && (
                <Button type="button" label="수정" icon="pi pi-pencil" text size="small" aria-label={`${step}단계 ${label} 수정`} onClick={() => onEditStep(step)} />
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

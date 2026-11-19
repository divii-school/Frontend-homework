"use client";

import { useState } from "react";
import { Controller, useFieldArray, useFormContext, useWatch } from "react-hook-form";
import { Dropdown } from "primereact/dropdown";
import { InputText } from "primereact/inputtext";
import { InputSwitch } from "primereact/inputswitch";
import { Button } from "primereact/button";
import type { CategoryRef, Product } from "@/api-services/ProductService.types";
import {
  useGetPickerCategories,
  useGetPickerChildCategories,
  useGetPickerSubCategories,
} from "@/hooks/API/products/useProductPickers";
import type { ApiError } from "@/types/api";
import FormField from "./FormField";
import MoneyInput from "./MoneyInput";
import OptionPickerDialog from "./OptionPickerDialog";
import { FORM_LIMITS, FORM_MESSAGES, type ProductFormValues } from "./product-form.model";

/** Edit mode (design 8.1.2 #10): the category is shown read-only with these names. */
export interface LockedCategory {
  category: CategoryRef | null;
  subCategory: CategoryRef | null;
  childCategory: CategoryRef | null;
}

interface StepCategoryOptionsProps {
  lockedCategory?: LockedCategory;
  /** Edit: the product itself (it cannot be its own option). */
  productId?: number;
  /** Edit: number of option rows of other kinds (category options) that are kept as they are. */
  keptOptionCount: number;
  /** Edit: the product had single-item options when it was loaded. */
  hadOptions: boolean;
  /** Edit: loaded with "Required option" on but no option rows (the API allows it) → can be saved as it is. */
  allowEmptyOptions?: boolean;
}

function pickerHint(loading: boolean, error: ApiError | null, needsParent: string | null): string | undefined {
  if (needsParent) return needsParent;
  if (loading) return "불러오는 중…";
  if (error) return `목록을 불러오지 못했습니다: ${error.message}`;
  return undefined;
}

// Step 3 — Category & options (design 8.1.1 #10–15, 8.1.3, 8.1.2 #10–11):
//  - cascading Major → Medium → Minor category (all three required; read-only on edit)
//  - optional single-item options: "Add single-item option" opens the product search popup;
//    each row = code, title, option price (defaults to that product's selling price), remove (x)
//  - "Required option for purchase" switch → isOptions yes / no (same mapping as the real admin)
export default function StepCategoryOptions({
  lockedCategory,
  productId,
  keptOptionCount,
  hadOptions,
  allowEmptyOptions = false,
}: StepCategoryOptionsProps) {
  const { control, setValue, clearErrors, getValues, formState: { errors } } = useFormContext<ProductFormValues>();
  const { fields, append, remove } = useFieldArray({ control, name: "options", keyName: "key" });
  const [pickerOpen, setPickerOpen] = useState(false);

  const categoryId = useWatch({ control, name: "categoryId" });
  const subCategoryId = useWatch({ control, name: "subCategoryId" });
  const locked = Boolean(lockedCategory);

  // Picker lists (cached for 5 minutes; disabled until the parent level is chosen)
  const categories = useGetPickerCategories();
  const subCategories = useGetPickerSubCategories(locked ? null : categoryId);
  const childCategories = useGetPickerChildCategories(locked ? null : subCategoryId);

  // ---- Options table ----
  const addOptions = (products: Product[]) => {
    const wasEmpty = getValues("options").length === 0;
    append(
      products.map((product) => ({
        optionId: product.id,
        optionCode: product.productCode ?? "",
        optionName: product.productName ?? "",
        // starts at that product's own selling price (`price`); the admin can change it in the table
        price: Number.isFinite(Number(product.price)) ? Math.max(0, Math.trunc(Number(product.price))) : 0,
      })),
    );
    // First option added → "required for purchase" on by default (isOptions = yes when there are options)
    if (wasEmpty && products.length > 0) setValue("optionsRequired", true, { shouldDirty: true });
    clearErrors(["options", "optionsRequired"]);
    setPickerOpen(false);
  };

  const removeOption = (index: number) => {
    remove(index);
    if (getValues("options").length === 0 && keptOptionCount === 0) setValue("optionsRequired", false, { shouldDirty: true });
    clearErrors("options");
  };

  const optionsError = errors.options?.message ?? errors.options?.root?.message;

  return (
    <div className="product-form-grid">
      {/* Registration category: Major → Medium → Minor */}
      <fieldset className="product-form-fieldset product-form-field-wide">
        <legend className="product-form-label">
          <span>
            등록 카테고리
            <span className="product-form-required" aria-hidden="true">
              *
            </span>
          </span>
          {locked && <span className="product-form-legend-note">등록 후 변경 불가</span>}
        </legend>

        {locked && lockedCategory ? (
          <div className="category-picker">
            {[
              { id: "product-category", label: "대분류", value: lockedCategory.category },
              { id: "product-sub-category", label: "중분류", value: lockedCategory.subCategory },
              { id: "product-child-category", label: "소분류", value: lockedCategory.childCategory },
            ].map((level) => (
              <FormField key={level.id} id={level.id} label={level.label}>
                {(field) => <InputText {...field} readOnly value={level.value?.name ?? "-"} />}
              </FormField>
            ))}
          </div>
        ) : (
          <div className="category-picker">
            <Controller
              control={control}
              name="categoryId"
              rules={{ validate: (value) => value !== null || FORM_MESSAGES.categoryRequired }}
              render={({ field, fieldState }) => (
                <FormField
                  id="product-category"
                  label="대분류"
                  required
                  error={fieldState.error?.message}
                  hint={pickerHint(categories.isPending, categories.error, null)}
                >
                  {({ id, className, ...aria }) => (
                    <Dropdown
                      {...aria}
                      inputId={id}
                      className={className}
                      focusInputRef={field.ref}
                      value={field.value}
                      options={categories.data ?? []}
                      optionLabel="name"
                      optionValue="id"
                      placeholder="선택"
                      emptyMessage="등록된 카테고리가 없습니다"
                      onChange={(event) => {
                        field.onChange(event.value);
                        // A new major category empties the two levels below it
                        setValue("subCategoryId", null, { shouldDirty: true });
                        setValue("childCategoryId", null, { shouldDirty: true });
                      }}
                      onBlur={field.onBlur}
                    />
                  )}
                </FormField>
              )}
            />
            <Controller
              control={control}
              name="subCategoryId"
              rules={{ validate: (value) => value !== null || FORM_MESSAGES.subCategoryRequired }}
              render={({ field, fieldState }) => (
                <FormField
                  id="product-sub-category"
                  label="중분류"
                  required
                  error={fieldState.error?.message}
                  hint={pickerHint(subCategories.isFetching, subCategories.error, categoryId === null ? "대분류를 먼저 선택해 주세요." : null)}
                >
                  {({ id, className, ...aria }) => (
                    <Dropdown
                      {...aria}
                      inputId={id}
                      className={className}
                      focusInputRef={field.ref}
                      value={field.value}
                      options={subCategories.data ?? []}
                      optionLabel="name"
                      optionValue="id"
                      placeholder="선택"
                      emptyMessage="등록된 중분류가 없습니다"
                      disabled={categoryId === null}
                      onChange={(event) => {
                        field.onChange(event.value);
                        setValue("childCategoryId", null, { shouldDirty: true });
                      }}
                      onBlur={field.onBlur}
                    />
                  )}
                </FormField>
              )}
            />
            <Controller
              control={control}
              name="childCategoryId"
              rules={{ validate: (value) => value !== null || FORM_MESSAGES.childCategoryRequired }}
              render={({ field, fieldState }) => (
                <FormField
                  id="product-child-category"
                  label="소분류"
                  required
                  error={fieldState.error?.message}
                  hint={pickerHint(childCategories.isFetching, childCategories.error, subCategoryId === null ? "중분류를 먼저 선택해 주세요." : null)}
                >
                  {({ id, className, ...aria }) => (
                    <Dropdown
                      {...aria}
                      inputId={id}
                      className={className}
                      focusInputRef={field.ref}
                      value={field.value}
                      options={childCategories.data ?? []}
                      optionLabel="name"
                      optionValue="id"
                      placeholder="선택"
                      emptyMessage="등록된 소분류가 없습니다"
                      disabled={subCategoryId === null}
                      onChange={(event) => field.onChange(event.value)}
                      onBlur={field.onBlur}
                    />
                  )}
                </FormField>
              )}
            />
          </div>
        )}
      </fieldset>

      {/* Single-item options (optional) */}
      <section className="product-options product-form-field-wide" aria-labelledby="product-options-title">
        <div className="product-options-head">
          <h3 id="product-options-title" className="product-form-label">
            옵션선택 <span className="product-options-optional">(선택 사항)</span>
          </h3>
          <Controller
            control={control}
            name="optionsRequired"
            rules={{
              validate: (required, values) =>
                !required || allowEmptyOptions || values.options.length > 0 || keptOptionCount > 0 || FORM_MESSAGES.optionsRequired,
            }}
            render={({ field, fieldState }) => (
              <div className="product-options-switch">
                <label htmlFor="product-options-required">상품 구매 필수 옵션 선택</label>
                <InputSwitch
                  inputId="product-options-required"
                  inputRef={field.ref}
                  checked={field.value}
                  aria-invalid={fieldState.error ? true : undefined}
                  aria-describedby={fieldState.error ? "product-options-required-error" : undefined}
                  onChange={(event) => field.onChange(Boolean(event.value))}
                  onBlur={field.onBlur}
                />
                {fieldState.error && (
                  <p id="product-options-required-error" className="field-error product-options-switch-error" role="alert">
                    {fieldState.error.message}
                  </p>
                )}
              </div>
            )}
          />
        </div>

        {keptOptionCount > 0 && (
          <p className="field-hint">
            이 상품에는 관리자 화면에서 등록한 카테고리 옵션 {keptOptionCount}건이 있으며, 그대로 유지됩니다.
          </p>
        )}

        {fields.length > 0 ? (
          <div className="table-scroll-box">
            <table className="product-options-table">
              <caption className="sr-only">단권 옵션</caption>
              <thead>
                <tr>
                  <th scope="col">상품코드</th>
                  <th scope="col">도서명</th>
                  <th scope="col">판매가</th>
                  <th scope="col">
                    <span className="sr-only">삭제</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {fields.map((row, index) => (
                  <tr key={row.key}>
                    <td>{row.optionCode || "-"}</td>
                    <td>{row.optionName || "-"}</td>
                    <td>
                      <Controller
                        control={control}
                        name={`options.${index}.price`}
                        rules={{
                          validate: (value) => {
                            if (value === null) return FORM_MESSAGES.optionPriceRequired;
                            if (value > FORM_LIMITS.intMax) return FORM_MESSAGES.moneyTooLarge;
                            return true;
                          },
                        }}
                        render={({ field, fieldState }) => {
                          const inputId = `product-option-price-${index}`;
                          const errorId = `${inputId}-error`;
                          return (
                            <div className="product-options-price">
                              <label htmlFor={inputId} className="sr-only">
                                {row.optionName} 판매가
                              </label>
                              <MoneyInput
                                id={inputId}
                                ref={field.ref}
                                name={field.name}
                                value={field.value}
                                onChange={field.onChange}
                                onBlur={field.onBlur}
                                className={fieldState.error ? "p-invalid" : undefined}
                                aria-invalid={fieldState.error ? true : undefined}
                                aria-describedby={fieldState.error ? errorId : undefined}
                              />
                              {fieldState.error && (
                                <p id={errorId} className="field-error" role="alert">
                                  {fieldState.error.message}
                                </p>
                              )}
                            </div>
                          );
                        }}
                      />
                    </td>
                    <td>
                      <Button
                        type="button"
                        icon="pi pi-times"
                        text
                        severity="secondary"
                        aria-label={`${row.optionName} 옵션 삭제`}
                        onClick={() => removeOption(index)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="product-options-empty">
            등록된 옵션이 없습니다. 옵션은 이 상품과 함께 판매하는 다른 상품입니다. (예: 워크북)
            {hadOptions && " 참고: 수정 화면에서 옵션을 모두 삭제하면 기존 옵션이 그대로 유지됩니다."}
          </p>
        )}

        <Button
          id="product-options-add"
          type="button"
          label="단권 옵션 추가"
          icon="pi pi-plus"
          outlined
          className="product-options-add"
          aria-invalid={optionsError ? true : undefined}
          aria-describedby={optionsError ? "product-options-add-error" : undefined}
          onClick={() => setPickerOpen(true)}
        />
        {optionsError && (
          <p id="product-options-add-error" className="field-error" role="alert">
            {optionsError}
          </p>
        )}
      </section>

      {pickerOpen && (
        <OptionPickerDialog
          pickedIds={fields.map((row) => row.optionId)}
          excludeId={productId}
          onAdd={addOptions}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </div>
  );
}

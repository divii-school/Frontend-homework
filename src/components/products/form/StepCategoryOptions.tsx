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
}

function pickerHint(loading: boolean, error: ApiError | null, needsParent: string | null): string | undefined {
  if (needsParent) return needsParent;
  if (loading) return "Loading…";
  if (error) return `Could not load the list: ${error.message}`;
  return undefined;
}

// Step 3 — Category & options (design 8.1.1 #10–15, 8.1.3, 8.1.2 #10–11):
//  - cascading Major → Medium → Minor category (all three required; read-only on edit)
//  - optional single-item options: "Add single-item option" opens the product search popup;
//    each row = code, title, option price (defaults to that product's selling price), remove (x)
//  - "Required option for purchase" switch → isOptions yes / no (same mapping as the real admin)
export default function StepCategoryOptions({ lockedCategory, productId, keptOptionCount, hadOptions }: StepCategoryOptionsProps) {
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
        price: Number.isFinite(Number(product.unitPrice)) ? Math.max(0, Math.trunc(Number(product.unitPrice))) : 0,
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
            Registration category
            <span className="product-form-required" aria-hidden="true">
              *
            </span>
          </span>
          {locked && <span className="product-form-legend-note">Cannot be changed after registration</span>}
        </legend>

        {locked && lockedCategory ? (
          <div className="category-picker">
            {[
              { id: "product-category", label: "Major category", value: lockedCategory.category },
              { id: "product-sub-category", label: "Medium category", value: lockedCategory.subCategory },
              { id: "product-child-category", label: "Minor category", value: lockedCategory.childCategory },
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
                  label="Major category"
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
                      placeholder="Select"
                      emptyMessage="No categories"
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
                  label="Medium category"
                  required
                  error={fieldState.error?.message}
                  hint={pickerHint(subCategories.isFetching, subCategories.error, categoryId === null ? "Select a major category first." : null)}
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
                      placeholder="Select"
                      emptyMessage="No medium categories"
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
                  label="Minor category"
                  required
                  error={fieldState.error?.message}
                  hint={pickerHint(childCategories.isFetching, childCategories.error, subCategoryId === null ? "Select a medium category first." : null)}
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
                      placeholder="Select"
                      emptyMessage="No minor categories"
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
            Options <span className="product-options-optional">(optional)</span>
          </h3>
          <Controller
            control={control}
            name="optionsRequired"
            rules={{
              validate: (required, values) => !required || values.options.length > 0 || keptOptionCount > 0 || FORM_MESSAGES.optionsRequired,
            }}
            render={({ field, fieldState }) => (
              <div className="product-options-switch">
                <label htmlFor="product-options-required">Required option for purchase</label>
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
            This product also has {keptOptionCount} category option{keptOptionCount > 1 ? "s" : ""} from the admin. They are kept as they are.
          </p>
        )}

        {fields.length > 0 ? (
          <div className="table-scroll-box">
            <table className="product-options-table">
              <caption className="sr-only">Single-item options</caption>
              <thead>
                <tr>
                  <th scope="col">Product code</th>
                  <th scope="col">Book title</th>
                  <th scope="col">Option price</th>
                  <th scope="col">
                    <span className="sr-only">Remove</span>
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
                                Option price for {row.optionName}
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
                        aria-label={`Remove option ${row.optionName}`}
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
            No options. Options are other products sold together with this one (e.g. a workbook).
            {hadOptions && " Note: the API keeps the old options when every option is removed on edit."}
          </p>
        )}

        <Button
          id="product-options-add"
          type="button"
          label="Add single-item option"
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

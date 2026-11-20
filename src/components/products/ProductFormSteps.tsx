"use client";

import { Dropdown } from "primereact/dropdown";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { ListBox } from "primereact/listbox";
import { FormField, invalidProps } from "@/components/common/FormField";
import { ImageUploader } from "@/components/products/ImageUploader";
import { PRODUCT_NAME_MAX_LENGTH, TAX_TYPE_OPTIONS, YES_NO_OPTIONS } from "@/constants/products";
import { useCategoryOptions } from "@/hooks/API/categories/useCategories";
import type { CategoryLevel } from "@/types/category";
import type { ProductFormErrors, ProductFormValues, ProductImage } from "@/types/product";
import { formatWon } from "@/utils/format";
import { formPrice } from "@/utils/product-rules";

/** Every step gets the same props. The values live in the parent (ProductForm), so a step holds no state of its own. */
export interface StepProps {
  mode: "create" | "edit";
  values: ProductFormValues;
  errors: ProductFormErrors;
  onChange: (changes: Partial<ProductFormValues>) => void;
  /** Images change through an updater (see ImageUploader). */
  onImagesChange: (update: (images: ProductImage[]) => ProductImage[]) => void;
}

/** A text input bound to one string field of the form. */
function TextField(
  props: StepProps & {
    name: "productName" | "erpName" | "quantity" | "unitPrice" | "erpUnitPrice";
    label: string;
    numeric?: boolean;
    placeholder?: string;
    maxLength?: number;
  },
) {
  const { values, errors, onChange, name, label, numeric, placeholder, maxLength } = props;
  const id = `product-${name}`;
  return (
    <FormField id={id} label={label} required error={errors[name]}>
      <InputText
        id={id}
        aria-required
        value={values[name]}
        placeholder={placeholder}
        maxLength={maxLength}
        inputMode={numeric ? "numeric" : undefined}
        onChange={(event) => onChange({ [name]: event.target.value })}
        {...invalidProps(id, errors[name])}
      />
    </FormField>
  );
}

/** A required dropdown bound to one field (비과세, 노출상태, 판매상태). */
function SelectField<T extends string | boolean>(props: {
  field: "taxType" | "isVisible" | "onSale";
  label: string;
  placeholder: string;
  value: T | null;
  options: { label: string; value: T }[];
  error?: string;
  onSelect: (value: T) => void;
}) {
  const { field, label, placeholder, value, options, error, onSelect } = props;
  const id = `product-${field}`;
  return (
    <FormField id={id} label={label} required error={error}>
      <Dropdown
        inputId={id}
        value={value}
        options={options}
        placeholder={placeholder}
        invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        onChange={(event) => onSelect(event.value as T)}
      />
    </FormField>
  );
}

/** Step 1: names and tax. The product code comes from the server and cannot be typed. */
export function BasicStep(props: StepProps) {
  const { mode, values, errors, onChange } = props;
  return (
    <div className="form-grid">
      <TextField {...props} name="productName" label="상품명" placeholder="상품명" maxLength={PRODUCT_NAME_MAX_LENGTH} />
      <FormField
        id="product-productCode"
        label="상품코드"
        required
        error={errors.productCode}
        hint={mode === "create" ? "서버에서 자동으로 발급됩니다." : undefined}
      >
        <InputText id="product-productCode" value={values.productCode} readOnly {...invalidProps("product-productCode", errors.productCode)} />
      </FormField>
      <TextField {...props} name="erpName" label="상품 ERP명" placeholder="ERP 상품명을 입력해 주세요." />
      <SelectField
        field="taxType"
        label="비과세"
        placeholder="비과세를 선택해 주세요."
        value={values.taxType}
        options={TAX_TYPE_OPTIONS}
        error={errors.taxType}
        onSelect={(taxType) => onChange({ taxType })}
      />
    </div>
  );
}

/** Step 2: numbers. 판매가 is shown, not typed: 수량 × 단가. */
export function PriceStep(props: StepProps) {
  const price = formPrice(props.values);
  const keepsSavedPrice = props.values.storedPrice !== null;
  return (
    <div className="form-grid">
      <TextField {...props} name="quantity" label="수량" numeric placeholder="0" />
      <TextField {...props} name="unitPrice" label="단가(원)" numeric placeholder="0" />
      <TextField {...props} name="erpUnitPrice" label="ERP 단가(원)" numeric placeholder="0" />
      <FormField
        id="product-price"
        label="판매가"
        hint={keepsSavedPrice ? "저장된 판매가입니다. 수량이나 단가를 바꾸면 수량 × 단가로 다시 계산됩니다." : "수량 × 단가로 자동 계산됩니다."}
      >
        <InputText id="product-price" value={price === null ? "" : formatWon(price)} readOnly placeholder="수량 × 단가 자동 계산" />
      </FormField>
    </div>
  );
}

/** One column of the category picker: a list whose options depend on the level above. */
function CategoryColumn(props: {
  level: CategoryLevel;
  /** 대분류 / 중분류 / 소분류: the column heading and the list's name for screen readers. Korean only (QA, 18 Nov). */
  label: string;
  field: "categoryId" | "subCategoryId" | "childCategoryId";
  parentId: number | null;
  value: number | null;
  invalid: boolean;
  readOnly: boolean;
  onSelect: (id: number | null) => void;
}) {
  const { level, label, field, parentId, value, invalid, readOnly, onSelect } = props;
  const options = useCategoryOptions(level, parentId);
  const waitingForParent = level !== "category" && parentId === null;
  const emptyMessage = waitingForParent
    ? "상위 분류를 먼저 선택해 주세요."
    : options.isLoading
      ? "불러오는 중입니다."
      : (options.error?.messages[0] ?? "선택할 수 있는 항목이 없습니다.");
  return (
    <div className="category-picker-column">
      <p className="category-picker-title" aria-hidden="true">
        {label}
      </p>
      <ListBox
        id={`product-${field}`}
        className={invalid ? "p-invalid" : undefined}
        value={value}
        options={options.data ?? []}
        optionLabel="name"
        optionValue="id"
        disabled={readOnly || waitingForParent}
        emptyMessage={emptyMessage}
        aria-label={label}
        onChange={(event) => {
          // A click on the selected item would clear it; a pick is always a choice.
          if (event.value !== null && event.value !== undefined) onSelect(event.value as number);
        }}
      />
    </div>
  );
}

/**
 * Step 3: 대분류 > 중분류 > 소분류 as three lists under one 카테고리* label (design 8.1.1). Changing a level clears
 * the levels below it, which no longer belong to it. When editing, the category cannot be changed (design 8.1.2:
 * "등록 후 변경 불가"): the lists show the saved path and are read-only.
 */
export function CategoryStep({ mode, values, errors, onChange }: StepProps) {
  const readOnly = mode === "edit";
  const error = errors.categoryId ?? errors.subCategoryId ?? errors.childCategoryId;
  return (
    <div className={`form-field category-picker${error ? " form-field-invalid" : ""}`} role="group" aria-labelledby="product-category-label">
      <p className="form-field-label form-field-label-required" id="product-category-label">
        카테고리
      </p>
      {readOnly && <p className="form-field-hint">등록 후 변경 불가</p>}
      <div className="category-picker-columns">
        <CategoryColumn
          level="category"
          label="대분류"
          field="categoryId"
          parentId={null}
          value={values.categoryId}
          invalid={Boolean(errors.categoryId)}
          readOnly={readOnly}
          onSelect={(id) => onChange({ categoryId: id, subCategoryId: null, childCategoryId: null })}
        />
        <CategoryColumn
          level="sub"
          label="중분류"
          field="subCategoryId"
          parentId={values.categoryId}
          value={values.subCategoryId}
          invalid={Boolean(errors.subCategoryId)}
          readOnly={readOnly}
          onSelect={(id) => onChange({ subCategoryId: id, childCategoryId: null })}
        />
        <CategoryColumn
          level="child"
          label="소분류"
          field="childCategoryId"
          parentId={values.subCategoryId}
          value={values.childCategoryId}
          invalid={Boolean(errors.childCategoryId)}
          readOnly={readOnly}
          onSelect={(id) => onChange({ childCategoryId: id })}
        />
      </div>
      {error && (
        <p className="form-field-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

/** Step 4: description, images, and 노출상태 / 판매상태 (design 8.1.1 order). */
export function MediaStep({ values, errors, onChange, onImagesChange }: StepProps) {
  return (
    <div className="form-stack">
      <FormField id="product-description" label="상세설명" required error={errors.description}>
        <InputTextarea
          id="product-description"
          aria-required
          value={values.description}
          placeholder="내용"
          rows={6}
          autoResize
          onChange={(event) => onChange({ description: event.target.value })}
          {...invalidProps("product-description", errors.description)}
        />
      </FormField>
      <FormField id="product-images" label="이미지" required>
        <ImageUploader images={values.images} error={errors.images} onImagesChange={onImagesChange} />
      </FormField>
      <div className="form-grid form-grid-pair">
        <SelectField
          field="isVisible"
          label="노출상태"
          placeholder="선택"
          value={values.isVisible}
          options={YES_NO_OPTIONS}
          error={errors.isVisible}
          onSelect={(isVisible) => onChange({ isVisible })}
        />
        <SelectField
          field="onSale"
          label="판매상태"
          placeholder="선택"
          value={values.onSale}
          options={YES_NO_OPTIONS}
          error={errors.onSale}
          onSelect={(onSale) => onChange({ onSale })}
        />
      </div>
    </div>
  );
}

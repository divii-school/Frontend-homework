"use client";

import { Dropdown } from "primereact/dropdown";
import { InputSwitch } from "primereact/inputswitch";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { FormField, invalidProps } from "@/components/common/FormField";
import { ImageUploader } from "@/components/products/ImageUploader";
import { TAX_TYPE_OPTIONS } from "@/constants/products";
import { useCategoryOptions } from "@/hooks/API/categories/useCategories";
import type { CategoryLevel } from "@/types/category";
import type { ProductFormErrors, ProductFormValues } from "@/types/product";
import { formatWon } from "@/utils/format";
import { salePrice } from "@/utils/product-rules";

/** Every step gets the same three props. The values live in the parent (ProductForm), so a step holds no state of its own. */
export interface StepProps {
  values: ProductFormValues;
  errors: ProductFormErrors;
  onChange: (changes: Partial<ProductFormValues>) => void;
}

/** A text input bound to one string field of the form. */
function TextField(props: StepProps & { name: "productName" | "erpName" | "quantity" | "unitPrice" | "erpUnitPrice"; label: string; numeric?: boolean; placeholder?: string }) {
  const { values, errors, onChange, name, label, numeric, placeholder } = props;
  const id = `product-${name}`;
  return (
    <FormField id={id} label={label} required error={errors[name]}>
      <InputText
        id={id}
        value={values[name]}
        placeholder={placeholder}
        inputMode={numeric ? "numeric" : undefined}
        onChange={(event) => onChange({ [name]: event.target.value })}
        {...invalidProps(id, errors[name])}
      />
    </FormField>
  );
}

/** Step 1: names and tax. The product code comes from the server and cannot be typed. */
export function BasicStep(props: StepProps) {
  const { values, errors, onChange } = props;
  return (
    <div className="form-grid">
      <TextField {...props} name="productName" label="상품명" placeholder="상품명을 입력해 주세요." />
      <FormField id="product-productCode" label="상품코드" required error={errors.productCode} hint="서버에서 자동으로 발급됩니다.">
        <InputText id="product-productCode" value={values.productCode} readOnly {...invalidProps("product-productCode", errors.productCode)} />
      </FormField>
      <TextField {...props} name="erpName" label="상품 ERP명" placeholder="ERP 상품명을 입력해 주세요." />
      <FormField id="product-taxType" label="과세 구분" required>
        <Dropdown inputId="product-taxType" value={values.taxType} options={TAX_TYPE_OPTIONS} onChange={(event) => onChange({ taxType: event.value })} />
      </FormField>
    </div>
  );
}

/** Step 2: numbers. 판매가 is shown, not typed: 수량 × 단가. */
export function PriceStep(props: StepProps) {
  const price = salePrice(props.values);
  return (
    <div className="form-grid">
      <TextField {...props} name="quantity" label="수량" numeric placeholder="0" />
      <TextField {...props} name="unitPrice" label="단가(원)" numeric placeholder="0" />
      <TextField {...props} name="erpUnitPrice" label="ERP 단가(원)" numeric placeholder="0" />
      <FormField id="product-price" label="판매가" hint="수량 × 단가로 자동 계산됩니다.">
        <InputText id="product-price" value={price === null ? "" : formatWon(price)} readOnly placeholder="수량 × 단가 자동 계산" />
      </FormField>
    </div>
  );
}

/** One of the three category selects. Its options depend on the level above. */
function CategorySelect(props: {
  level: CategoryLevel;
  label: string;
  field: "categoryId" | "subCategoryId" | "childCategoryId";
  parentId: number | null;
  value: number | null;
  error?: string;
  onSelect: (id: number | null) => void;
}) {
  const { level, label, field, parentId, value, error, onSelect } = props;
  const options = useCategoryOptions(level, parentId);
  const waitingForParent = level !== "category" && parentId === null;
  const id = `product-${field}`;
  return (
    <FormField id={id} label={label} required error={error ?? options.error?.messages[0]}>
      <Dropdown
        inputId={id}
        value={value}
        options={options.data ?? []}
        optionLabel="name"
        optionValue="id"
        placeholder={waitingForParent ? "상위 분류를 먼저 선택해 주세요." : "선택"}
        disabled={waitingForParent}
        loading={options.isLoading}
        emptyMessage="선택할 수 있는 항목이 없습니다."
        invalid={Boolean(error)}
        onChange={(event) => onSelect(event.value ?? null)}
      />
    </FormField>
  );
}

/** Step 3: 대분류 > 중분류 > 소분류. Changing a level clears the levels below it, which no longer belong to it. */
export function CategoryStep({ values, errors, onChange }: StepProps) {
  return (
    <div className="form-grid form-grid-three">
      <CategorySelect
        level="category"
        label="대분류"
        field="categoryId"
        parentId={null}
        value={values.categoryId}
        error={errors.categoryId}
        onSelect={(id) => onChange({ categoryId: id, subCategoryId: null, childCategoryId: null })}
      />
      <CategorySelect
        level="sub"
        label="중분류"
        field="subCategoryId"
        parentId={values.categoryId}
        value={values.subCategoryId}
        error={errors.subCategoryId}
        onSelect={(id) => onChange({ subCategoryId: id, childCategoryId: null })}
      />
      <CategorySelect
        level="child"
        label="소분류"
        field="childCategoryId"
        parentId={values.subCategoryId}
        value={values.childCategoryId}
        error={errors.childCategoryId}
        onSelect={(id) => onChange({ childCategoryId: id })}
      />
    </div>
  );
}

/** Step 4: images, description and the two switches. */
export function MediaStep({ values, errors, onChange }: StepProps) {
  return (
    <div className="form-stack">
      <FormField id="product-images" label="이미지" required>
        <ImageUploader images={values.images} error={errors.images} onChange={(images) => onChange({ images })} />
      </FormField>
      <FormField id="product-description" label="상세설명" required error={errors.description}>
        <InputTextarea
          id="product-description"
          value={values.description}
          rows={6}
          autoResize
          onChange={(event) => onChange({ description: event.target.value })}
          {...invalidProps("product-description", errors.description)}
        />
      </FormField>
      <div className="form-switches">
        <label className="form-switch" htmlFor="product-isVisible">
          <InputSwitch inputId="product-isVisible" checked={values.isVisible} onChange={(event) => onChange({ isVisible: event.value })} />
          노출상태
        </label>
        <label className="form-switch" htmlFor="product-onSale">
          <InputSwitch inputId="product-onSale" checked={values.onSale} onChange={(event) => onChange({ onSale: event.value })} />
          판매상태
        </label>
      </div>
    </div>
  );
}

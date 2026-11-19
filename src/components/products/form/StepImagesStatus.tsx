"use client";

import { Controller, useFormContext } from "react-hook-form";
import { Dropdown } from "primereact/dropdown";
import { PRODUCT_RULES } from "@/utils/constants";
import FormField from "./FormField";
import ImageUploadField from "./ImageUploadField";
import { FORM_MESSAGES, YES_NO_OPTIONS, type ProductFormValues } from "./product-form.model";

const { min: MIN_IMAGES, max: MAX_IMAGES, maxSizeMB, acceptExtensions } = PRODUCT_RULES.images;

// Step 2 — Images & status (design 8.1.1 #7–9 / 8.1.2 #6–8):
// 1–4 product images (upload widget) + exposure status (isVisible) + sales status (onSale), both Yes / No.
export default function StepImagesStatus({ onUploadingChange }: { onUploadingChange: (busy: boolean) => void }) {
  const { control } = useFormContext<ProductFormValues>();

  return (
    <div className="product-form-grid">
      <Controller
        control={control}
        name="images"
        rules={{
          validate: (images) => {
            if (images.length < MIN_IMAGES) return FORM_MESSAGES.imagesRequired;
            // The API accepts any number of images, so this rule is what makes saving a 5th impossible
            if (images.length > MAX_IMAGES) return FORM_MESSAGES.imagesTooMany;
            return true;
          },
        }}
        render={({ field, fieldState }) => (
          <FormField
            id="product-images"
            label="이미지"
            required
            error={fieldState.error?.message}
            className="product-form-field-wide"
            hint={`권장 사이즈 : 800x800px ( 정사각형 ) / 최대 ${MAX_IMAGES}장까지 등록 가능합니다. ${acceptExtensions
              .filter((extension) => extension !== "jpeg")
              .join(", ")
              .toUpperCase()} 형식, 파일당 최대 ${maxSizeMB}MB. 첫 번째 이미지가 대표 이미지입니다.`}
          >
            {(a11y) => (
              <ImageUploadField
                id={a11y.id}
                aria-invalid={a11y["aria-invalid"]}
                aria-describedby={a11y["aria-describedby"]}
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                onBusyChange={onUploadingChange}
              />
            )}
          </FormField>
        )}
      />

      <Controller
        control={control}
        name="isVisible"
        rules={{ validate: (value) => value !== null || FORM_MESSAGES.isVisibleRequired }}
        render={({ field, fieldState }) => (
          <FormField id="product-is-visible" label="노출상태" required error={fieldState.error?.message} hint="예: 고객에게 상품이 노출됩니다.">
            {({ id, className, ...aria }) => (
              <Dropdown
                {...aria}
                inputId={id}
                className={className}
                focusInputRef={field.ref}
                value={field.value}
                options={[...YES_NO_OPTIONS]}
                placeholder="선택"
                onChange={(event) => field.onChange(event.value)}
                onBlur={field.onBlur}
              />
            )}
          </FormField>
        )}
      />

      <Controller
        control={control}
        name="onSale"
        rules={{ validate: (value) => value !== null || FORM_MESSAGES.onSaleRequired }}
        render={({ field, fieldState }) => (
          <FormField id="product-on-sale" label="판매상태" required error={fieldState.error?.message} hint="아니오: 상품을 주문할 수 없습니다.">
            {({ id, className, ...aria }) => (
              <Dropdown
                {...aria}
                inputId={id}
                className={className}
                focusInputRef={field.ref}
                value={field.value}
                options={[...YES_NO_OPTIONS]}
                placeholder="선택"
                onChange={(event) => field.onChange(event.value)}
                onBlur={field.onBlur}
              />
            )}
          </FormField>
        )}
      />
    </div>
  );
}

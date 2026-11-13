'use client';

import type { ReactNode } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { InputNumber } from 'primereact/inputnumber';
import { Dropdown } from 'primereact/dropdown';
import { AMOUNT_MAX, DESCRIPTION_MAX, ERP_NAME_MAX, NAME_MAX, type ProductFormInput } from './product-form-schema';
import { ImageUploader } from './image-uploader';
import styles from './product-form.module.scss';

/** Label + control + help/error, wired for screen readers (aria-describedby). */
export function FormField(props: {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  help?: string;
  children: ReactNode;
}) {
  const { id, label, required, error, help, children } = props;
  return (
    <div className={styles['field']}>
      <label htmlFor={id} className={styles['field-label']}>
        {label} {required && <span className={styles['required']} aria-hidden>*</span>}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} className={styles['field-error']} role="alert">
          {error}
        </p>
      ) : (
        help && (
          <p id={`${id}-help`} className={styles['field-help']}>
            {help}
          </p>
        )
      )}
    </div>
  );
}

const describedBy = (id: string, error?: string, help?: string) => (error ? `${id}-error` : help ? `${id}-help` : undefined);

/** ₩ amount input: digits only, commas as you type (8.1.2 "원 단위로 자동 변환"). */
function AmountInput({ name, label, help }: { name: 'price' | 'unitPrice' | 'erpUnitPrice' | 'quantity'; label: string; help?: string }) {
  const { control, formState } = useFormContext<ProductFormInput>();
  const error = formState.errors[name]?.message;
  const isQuantity = name === 'quantity';
  return (
    <FormField id={name} label={label} required error={error} help={help}>
      <Controller
        control={control}
        name={name}
        render={({ field }) => (
          <InputNumber
            inputId={name}
            value={field.value ?? null}
            onValueChange={(e) => field.onChange(e.value ?? undefined)}
            onBlur={field.onBlur}
            inputRef={field.ref}
            useGrouping
            locale="en-US"
            maxFractionDigits={0}
            min={0}
            max={AMOUNT_MAX}
            prefix={isQuantity ? undefined : '₩ '}
            suffix={isQuantity ? ' 개' : undefined}
            placeholder={isQuantity ? '1 개' : '₩ 0'}
            invalid={Boolean(error)}
            aria-invalid={Boolean(error)}
            aria-required
            aria-describedby={describedBy(name, error, help)}
            className={styles['full-width']}
          />
        )}
      />
    </FormField>
  );
}

/** Step 1 — 기본 정보 (8.1.1 ②~⑥). */
export function BasicStep() {
  const { register, formState } = useFormContext<ProductFormInput>();
  const e = formState.errors;
  return (
    <div className={styles['step-body']}>
      <FormField id="productName" label="상품명" required error={e.productName?.message} help={`최대 ${NAME_MAX}자`}>
        <InputText
          id="productName"
          maxLength={NAME_MAX + 20}
          placeholder="상품명을 입력해 주세요."
          invalid={Boolean(e.productName)}
          aria-invalid={Boolean(e.productName)}
          aria-required
          aria-describedby={describedBy('productName', e.productName?.message, 'x')}
          className={styles['full-width']}
          {...register('productName')}
        />
      </FormField>
      <FormField id="productCode" label="상품코드" error={e.productCode?.message} help="상품 등록 시 자동으로 생성되며 수정할 수 없습니다.">
        <InputText id="productCode" readOnly aria-readonly className={styles['full-width']} {...register('productCode')} />
      </FormField>
      <div className={styles['field-row']}>
        <AmountInput name="unitPrice" label="단가" help="판매가보다 작아야 합니다." />
        <AmountInput name="price" label="판매가" help="고객이 실제로 결제하는 금액" />
      </div>
      <FormField id="description" label="상세설명" required error={e.description?.message} help={`최대 ${DESCRIPTION_MAX.toLocaleString('en-US')}자`}>
        <InputTextarea
          id="description"
          rows={6}
          autoResize
          maxLength={DESCRIPTION_MAX + 50}
          placeholder="상품 상세설명을 입력해 주세요."
          invalid={Boolean(e.description)}
          aria-invalid={Boolean(e.description)}
          aria-required
          aria-describedby={describedBy('description', e.description?.message, 'x')}
          className={styles['full-width']}
          {...register('description')}
        />
      </FormField>
    </div>
  );
}

const YES_NO = [
  { label: '예', value: true },
  { label: '아니오', value: false },
];

/** Step 2 — 이미지 · 노출 (8.1.1 ⑦~⑨). */
export function MediaStep() {
  const { control, formState } = useFormContext<ProductFormInput>();
  const e = formState.errors;
  return (
    <div className={styles['step-body']}>
      <div className={styles['field']}>
        <span className={styles['field-label']} id="images-label">
          이미지 <span className={styles['required']} aria-hidden>*</span>
        </span>
        <Controller
          control={control}
          name="images"
          render={({ field }) => (
            <ImageUploader value={field.value} onChange={field.onChange} error={e.images?.message} describedById="images-help" />
          )}
        />
      </div>
      <div className={styles['field-row']}>
        <FormField id="isVisible" label="노출 상태" required help="예: 쇼핑몰에 노출 / 아니오: 미노출">
          <Controller
            control={control}
            name="isVisible"
            render={({ field }) => (
              <Dropdown inputId="isVisible" value={field.value} options={YES_NO} onChange={(ev) => field.onChange(ev.value)} className={styles['full-width']} aria-describedby="isVisible-help" />
            )}
          />
        </FormField>
        <FormField id="onSale" label="판매 상태" required help="아니오: 결제 진행 불가">
          <Controller
            control={control}
            name="onSale"
            render={({ field }) => (
              <Dropdown inputId="onSale" value={field.value} options={YES_NO} onChange={(ev) => field.onChange(ev.value)} className={styles['full-width']} aria-describedby="onSale-help" />
            )}
          />
        </FormField>
      </div>
    </div>
  );
}

const TAX_OPTIONS = [
  { label: '과세', value: 'tax' },
  { label: '비과세', value: 'tax_free' },
];

/** Step 4 — ERP 정보 (8.1.1 ⑯~⑳). The ERP code itself is assigned by the server. */
export function ErpStep({ erpCode }: { erpCode?: string }) {
  const { register, control, formState } = useFormContext<ProductFormInput>();
  const e = formState.errors;
  return (
    <div className={styles['step-body']}>
      <FormField id="erpCode" label="ERP 코드" help="ERP 코드는 서버에서 자동으로 부여됩니다.">
        <InputText id="erpCode" value={erpCode ?? '저장 시 자동 부여'} readOnly aria-readonly className={styles['full-width']} aria-describedby="erpCode-help" />
      </FormField>
      <FormField id="erpName" label="ERP 상품명" required error={e.erpName?.message} help={`최대 ${ERP_NAME_MAX}자`}>
        <InputText
          id="erpName"
          maxLength={ERP_NAME_MAX + 20}
          placeholder="ERP 상품명을 입력해 주세요."
          invalid={Boolean(e.erpName)}
          aria-invalid={Boolean(e.erpName)}
          aria-required
          aria-describedby={describedBy('erpName', e.erpName?.message, 'x')}
          className={styles['full-width']}
          {...register('erpName')}
        />
      </FormField>
      <div className={styles['field-row']}>
        <AmountInput name="quantity" label="수량" help="0보다 큰 정수" />
        <FormField id="taxType" label="과세 구분" required error={e.taxType?.message}>
          <Controller
            control={control}
            name="taxType"
            render={({ field }) => (
              <Dropdown inputId="taxType" value={field.value} options={TAX_OPTIONS} onChange={(ev) => field.onChange(ev.value)} className={styles['full-width']} />
            )}
          />
        </FormField>
      </div>
      <AmountInput name="erpUnitPrice" label="ERP 단가" />
    </div>
  );
}

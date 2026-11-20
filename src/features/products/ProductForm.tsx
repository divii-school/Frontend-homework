'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { Steps } from 'primereact/steps';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { InputTextarea } from 'primereact/inputtextarea';
import { Dropdown } from 'primereact/dropdown';
import { Button } from 'primereact/button';
import { confirmDialog } from 'primereact/confirmdialog';
import { errorText } from '@/components/common/QueryState';
import { useToast } from '@/components/providers/ToastProvider';
import { ImageUploader } from './components/ImageUploader';
import { productService } from './productService';
import { useChildcategories, useProductCategories, useSaveProduct, useSubcategories } from './useProducts';
import { STEP_LABELS, validateAll, validateStep, type FormErrors } from './validation';
import { TAX_TYPES, YES_NO_OPTIONS, type ProductFormValues } from './types';
import styles from './ProductForm.module.scss';

/**
 * Multi-step form. ALL steps share one `values` object owned here, so going
 * back never loses input. Values are also mirrored to sessionStorage, so an
 * API error or an accidental refresh keeps what the user typed.
 */
export function ProductForm({
  mode,
  productId,
  initial,
}: {
  mode: 'create' | 'edit';
  productId?: number;
  initial: ProductFormValues;
}) {
  const router = useRouter();
  const toast = useToast();
  const draftKey = `tc_product_draft_${mode === 'create' ? 'new' : productId}`;
  const [values, setValues] = useState<ProductFormValues>(initial);
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState('');
  const restored = useRef(false);
  const save = useSaveProduct(productId);

  // Restore a draft once (create, or the same product being edited).
  useEffect(() => {
    if (restored.current) return;
    restored.current = true;
    try {
      const raw = window.sessionStorage.getItem(draftKey);
      if (raw) setValues({ ...initial, ...(JSON.parse(raw) as Partial<ProductFormValues>) });
    } catch {
      /* ignore broken drafts */
    }
  }, [draftKey, initial]);

  useEffect(() => {
    try {
      // Blob previews die on reload; keep keys only.
      const toSave = { ...values, images: values.images.map((i) => ({ key: i.key, previewUrl: i.previewUrl.startsWith('blob:') ? '' : i.previewUrl })) };
      window.sessionStorage.setItem(draftKey, JSON.stringify(toSave));
    } catch {
      /* storage full or unavailable */
    }
  }, [values, draftKey]);

  // Auto-generate the product code for a new product.
  useEffect(() => {
    if (mode !== 'create' || values.productCode) return;
    productService
      .generateCode()
      .then((code) => code && setValues((v) => (v.productCode ? v : { ...v, productCode: code })))
      .catch(() => undefined);
  }, [mode, values.productCode]);

  const set = <K extends keyof ProductFormValues>(key: K, val: ProductFormValues[K]) => {
    setValues((v) => ({ ...v, [key]: val }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const categories = useProductCategories();
  const subs = useSubcategories(values.categoryId);
  const childs = useChildcategories(values.subCategoryId);

  const next = () => {
    const e = validateStep(step, values, mode);
    setErrors(e);
    if (Object.keys(e).length === 0) setStep((s) => s + 1);
  };

  const submit = () => {
    const bad = validateAll(values, mode);
    if (bad) {
      setStep(bad.step);
      setErrors(bad.errors);
      return;
    }
    setSubmitError('');
    save.mutate(values, {
      onSuccess: () => {
        window.sessionStorage.removeItem(draftKey);
        toast.show('success', mode === 'create' ? '상품이 등록되었습니다.' : '상품이 수정되었습니다.');
        router.push(mode === 'create' ? '/shopping/products' : `/shopping/products/${productId}`);
      },
      // Values stay in state + draft; only the message is shown.
      onError: (err) => setSubmitError(errorText(err)),
    });
  };

  const cancel = () =>
    confirmDialog({
      header: '취소 확인',
      message: '입력한 내용이 모두 삭제됩니다. 취소하시겠습니까?',
      acceptLabel: '예',
      rejectLabel: '아니요',
      defaultFocus: 'reject',
      accept: () => {
        window.sessionStorage.removeItem(draftKey);
        router.push('/shopping/products');
      },
    });

  return (
    <div className={styles.wrap}>
      <Steps
        model={STEP_LABELS.map((label) => ({ label }))}
        activeIndex={step}
        readOnly={false}
        onSelect={(e) => e.index < step && setStep(e.index)}
        className={styles.steps}
        aria-label="입력 단계"
      />

      <form className={styles.form} onSubmit={(e) => e.preventDefault()} noValidate>
        {step === 0 && (
          <fieldset className={styles.fieldset}>
            <legend className="sr-only">{STEP_LABELS[0]}</legend>
            <Field id="productName" label="상품명" required error={errors.productName}>
              <InputText
                id="productName"
                value={values.productName}
                onChange={(e) => set('productName', e.target.value)}
                placeholder="상품명을 입력해 주세요."
                className={errors.productName ? 'p-invalid' : ''}
                aria-invalid={!!errors.productName}
              />
            </Field>
            <Field id="productCode" label="상품코드" required={mode === 'create'} error={errors.productCode} help="상품코드는 등록 시 자동 생성됩니다.">
              <InputText id="productCode" value={values.productCode} readOnly aria-readonly="true" />
            </Field>
            <div className={styles.grid2}>
              <Field id="unitPrice" label="단가" required error={errors.unitPrice}>
                <InputNumber
                  inputId="unitPrice"
                  value={values.unitPrice}
                  onValueChange={(e) => set('unitPrice', e.value ?? null)}
                  mode="currency"
                  currency="KRW"
                  locale="ko-KR"
                  min={0}
                  invalid={!!errors.unitPrice}
                />
              </Field>
              <Field id="price" label="판매가" required error={errors.price}>
                <InputNumber
                  inputId="price"
                  value={values.price}
                  onValueChange={(e) => set('price', e.value ?? null)}
                  mode="currency"
                  currency="KRW"
                  locale="ko-KR"
                  min={0}
                  invalid={!!errors.price}
                />
              </Field>
            </div>
            <Field id="description" label="상세 설명" required error={errors.description}>
              <InputTextarea
                id="description"
                rows={8}
                value={values.description}
                onChange={(e) => set('description', e.target.value)}
                placeholder="상세 설명을 입력해 주세요."
                className={errors.description ? 'p-invalid' : ''}
                aria-invalid={!!errors.description}
              />
            </Field>
          </fieldset>
        )}

        {step === 1 && (
          <fieldset className={styles.fieldset}>
            <legend className="sr-only">{STEP_LABELS[1]}</legend>
            <div className="field">
              <span className="required" id="images-label" style={{ fontWeight: 600 }}>
                이미지
              </span>
              <ImageUploader value={values.images} onChange={(imgs) => set('images', imgs)} error={errors.images} />
            </div>
            <div className={styles.grid2}>
              <Field id="isVisible" label="노출 상태" required>
                <Dropdown inputId="isVisible" value={values.isVisible} options={YES_NO_OPTIONS} onChange={(e) => set('isVisible', e.value)} />
              </Field>
              <Field id="onSale" label="판매 상태" required>
                <Dropdown inputId="onSale" value={values.onSale} options={YES_NO_OPTIONS} onChange={(e) => set('onSale', e.value)} />
              </Field>
            </div>
          </fieldset>
        )}

        {step === 2 && (
          <fieldset className={styles.fieldset}>
            <legend className="sr-only">{STEP_LABELS[2]}</legend>
            <div className={styles.grid3}>
              <Field id="categoryId" label="대분류" required error={errors.categoryId}>
                <Dropdown
                  inputId="categoryId"
                  value={values.categoryId}
                  options={categories.data ?? []}
                  optionLabel="name"
                  optionValue="id"
                  placeholder={categories.isLoading ? '불러오는 중' : '선택해 주세요.'}
                  emptyMessage={categories.error ? errorText(categories.error) : '데이터가 없습니다.'}
                  onChange={(e) => setValues((v) => ({ ...v, categoryId: e.value, subCategoryId: null, childCategoryId: null }))}
                  invalid={!!errors.categoryId}
                />
              </Field>
              <Field id="subCategoryId" label="중분류" required error={errors.subCategoryId}>
                <Dropdown
                  inputId="subCategoryId"
                  value={values.subCategoryId}
                  options={subs.data ?? []}
                  optionLabel="name"
                  optionValue="id"
                  disabled={!values.categoryId}
                  placeholder={subs.isLoading ? '불러오는 중' : '선택해 주세요.'}
                  emptyMessage="데이터가 없습니다."
                  onChange={(e) => setValues((v) => ({ ...v, subCategoryId: e.value, childCategoryId: null }))}
                  invalid={!!errors.subCategoryId}
                />
              </Field>
              <Field id="childCategoryId" label="소분류" required error={errors.childCategoryId}>
                <Dropdown
                  inputId="childCategoryId"
                  value={values.childCategoryId}
                  options={childs.data ?? []}
                  optionLabel="name"
                  optionValue="id"
                  disabled={!values.subCategoryId}
                  placeholder={childs.isLoading ? '불러오는 중' : '선택해 주세요.'}
                  emptyMessage="데이터가 없습니다."
                  onChange={(e) => set('childCategoryId', e.value)}
                  invalid={!!errors.childCategoryId}
                />
              </Field>
            </div>
            <div className={styles.grid2}>
              <Field id="erpName" label="ERP 상품명" required error={errors.erpName}>
                <InputText
                  id="erpName"
                  value={values.erpName}
                  onChange={(e) => set('erpName', e.target.value)}
                  placeholder="ERP 상품명을 입력해 주세요."
                  className={errors.erpName ? 'p-invalid' : ''}
                />
              </Field>
              <Field id="quantity" label="수량" required error={errors.quantity}>
                <InputNumber inputId="quantity" value={values.quantity} onValueChange={(e) => set('quantity', e.value ?? null)} min={0} useGrouping invalid={!!errors.quantity} />
              </Field>
              <Field id="taxType" label="과세 구분" required error={errors.taxType}>
                <Dropdown
                  inputId="taxType"
                  value={values.taxType}
                  options={TAX_TYPES}
                  placeholder="과세 구분을 선택해 주세요."
                  onChange={(e) => set('taxType', e.value)}
                  invalid={!!errors.taxType}
                />
              </Field>
              <Field id="erpUnitPrice" label="ERP 단가" required error={errors.erpUnitPrice}>
                <InputNumber
                  inputId="erpUnitPrice"
                  value={values.erpUnitPrice}
                  onValueChange={(e) => set('erpUnitPrice', e.value ?? null)}
                  mode="currency"
                  currency="KRW"
                  locale="ko-KR"
                  min={0}
                  invalid={!!errors.erpUnitPrice}
                />
              </Field>
            </div>
          </fieldset>
        )}

        {submitError && (
          <div className={styles.submitError} role="alert">
            {submitError}
          </div>
        )}

        <div className={styles.actions}>
          <Button type="button" label="취소" outlined onClick={cancel} />
          {step > 0 && <Button type="button" label="이전" outlined onClick={() => setStep((s) => s - 1)} />}
          {step < STEP_LABELS.length - 1 ? (
            <Button type="button" label="다음" onClick={next} />
          ) : (
            <Button type="button" label={mode === 'create' ? '등록' : '저장'} onClick={submit} loading={save.isPending} />
          )}
        </div>
      </form>
    </div>
  );
}

function Field({
  id,
  label,
  required,
  error,
  help,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  help?: string;
  children: ReactNode;
}) {
  return (
    <div className="field">
      <label htmlFor={id} className={required ? 'required' : undefined}>
        {label}
      </label>
      {children}
      {error ? (
        <small id={`${id}-error`} className="p-error" role="alert">
          {error}
        </small>
      ) : (
        help && <small className="muted">{help}</small>
      )}
    </div>
  );
}

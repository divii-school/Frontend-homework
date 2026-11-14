'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { ROUTES } from '@/config/app-routes';
import { useCreateProduct, useUpdateProduct } from '@/hooks/api/product/use-products';
import { ApiError } from '@/lib/api/api-error';
import { errorMessage } from '@/lib/api/error-messages';
import { lastListQuery } from '@/lib/list-memory';
import { useToast } from '@/providers/toast-provider';
import { CategoryStep } from './category-step';
import { BasicStep, ErpStep, MediaStep } from './form-steps';
import {
  STEPS,
  productFormSchema,
  stepOfField,
  toSaveRequest,
  type ProductFormInput,
  type ProductFormValues,
} from './product-form-schema';
import styles from './product-form.module.scss';

interface Props {
  mode: 'create' | 'edit';
  /** Starting values (generated code for create, the product for edit). */
  initialValues: ProductFormInput;
  productId?: number;
  erpCode?: string;
  categoryPath?: string;
}

/** API messages that point at a field → which field (so we can open that step). */
const API_FIELD_KEYS: Record<string, keyof ProductFormValues> = {
  unitPriceMustBeLessThanPrice: 'unitPrice',
};

/**
 * Multi-step product form (8.1.1 등록 / 8.1.2 수정).
 * One react-hook-form instance holds every step's values, so going back never loses input;
 * "다음" validates only the current step. On an API error nothing is reset: the values stay,
 * the message shows, and if it belongs to a field we jump to that step.
 */
export function ProductForm({ mode, initialValues, productId, erpCode, categoryPath }: Props) {
  const router = useRouter();
  const toast = useToast();
  const [step, setStep] = useState(0);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);

  const methods = useForm<ProductFormInput, unknown, ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: initialValues,
    mode: 'onTouched',
  });
  const create = useCreateProduct();
  const update = useUpdateProduct(productId ?? 0);
  const saving = create.isPending || update.isPending || methods.formState.isSubmitting;
  const isLast = step === STEPS.length - 1;
  const backHref = mode === 'edit' && productId ? ROUTES.productDetails(productId) : `${ROUTES.products}${lastListQuery()}`;

  // Move focus to the step title so keyboard and screen-reader users know the step changed.
  useEffect(() => headingRef.current?.focus(), [step]);

  // Warn before leaving the tab with unsaved input.
  const dirty = methods.formState.isDirty;
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  const next = async () => {
    const valid = await methods.trigger([...STEPS[step].fields], { shouldFocus: true });
    if (valid) setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const onSubmit = methods.handleSubmit(
    async (values) => {
      setSubmitError(null);
      try {
        const body = toSaveRequest(values);
        if (mode === 'create') await create.mutateAsync(body);
        else await update.mutateAsync(body);
        toast.show('success', mode === 'create' ? '상품이 등록되었습니다.' : '상품이 수정되었습니다.');
        methods.reset(values); // not dirty any more → no leave warning
        router.push(mode === 'create' ? ROUTES.products : ROUTES.productDetails(productId as number));
      } catch (error) {
        const message = errorMessage(error);
        setSubmitError(message);
        const field = error instanceof ApiError ? error.apiMessages.map((m) => API_FIELD_KEYS[m]).find(Boolean) : undefined;
        if (field) {
          methods.setError(field, { message });
          setStep(stepOfField(field));
        }
      }
    },
    // Client validation failed on submit (e.g. a field on an earlier step): open that step.
    (errors) => {
      const first = Object.keys(errors)[0];
      if (first) setStep(stepOfField(first));
    },
  );

  const cancel = () => (dirty ? setConfirmCancel(true) : router.push(backHref));

  return (
    <FormProvider {...methods}>
      <form className={styles['product-form']} onSubmit={(e) => (isLast ? void onSubmit(e) : (e.preventDefault(), void next()))} noValidate>
        <ol className={styles['stepper']} aria-label="입력 단계">
          {STEPS.map((s, index) => (
            <li
              key={s.key}
              className={`${styles['stepper-item']} ${index === step ? styles['is-current'] : ''} ${index < step ? styles['is-done'] : ''}`}
              aria-current={index === step ? 'step' : undefined}
            >
              <span className={styles['stepper-number']}>{index < step ? <i className="pi pi-check" aria-hidden /> : index + 1}</span>
              <span className={styles['stepper-label']}>{s.label}</span>
            </li>
          ))}
        </ol>

        <section className={styles['step']} aria-labelledby="step-title">
          <h2 id="step-title" ref={headingRef} tabIndex={-1} className={styles['step-title']}>
            {step + 1}. {STEPS[step].label}
            <span className="sr-only">
              {' '}
              ({STEPS.length}단계 중 {step + 1}단계)
            </span>
          </h2>

          {submitError && (
            <div className={styles['submit-error']} role="alert">
              <i className="pi pi-exclamation-circle" aria-hidden /> 저장하지 못했습니다. 입력한 내용은 그대로 유지됩니다.
              <br />
              {submitError}
            </div>
          )}

          {/* Every step stays mounted so its inputs keep their values; only the current one shows. */}
          <div hidden={step !== 0}>
            <BasicStep />
          </div>
          <div hidden={step !== 1}>
            <MediaStep />
          </div>
          <div hidden={step !== 2}>
            <CategoryStep readOnly={mode === 'edit'} currentPath={categoryPath} />
          </div>
          <div hidden={step !== 3}>
            <ErpStep erpCode={erpCode} />
          </div>
        </section>

        <div className={styles['form-actions']}>
          <Button type="button" label="취소" outlined onClick={cancel} disabled={saving} />
          <div className={styles['form-actions-right']}>
            {step > 0 && <Button type="button" label="이전" outlined icon="pi pi-angle-left" onClick={() => setStep((s) => s - 1)} disabled={saving} />}
            {isLast ? (
              <Button type="submit" label={mode === 'create' ? '등록' : '저장'} loading={saving} />
            ) : (
              <Button type="submit" label="다음" icon="pi pi-angle-right" iconPos="right" />
            )}
          </div>
        </div>
      </form>

      <Dialog
        visible={confirmCancel}
        header="작성 취소"
        onHide={() => setConfirmCancel(false)}
        className={styles['dialog']}
        draggable={false}
        footer={
          <div className={styles['dialog-footer']}>
            <Button label="아니오" outlined onClick={() => setConfirmCancel(false)} autoFocus />
            <Button
              label="예"
              severity="danger"
              onClick={() => {
                methods.reset(initialValues);
                router.push(backHref);
              }}
            />
          </div>
        }
      >
        <p className={styles['dialog-text']}>입력한 정보는 모두 삭제됩니다. 취소하시겠습니까?</p>
      </Dialog>
    </FormProvider>
  );
}

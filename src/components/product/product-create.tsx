'use client';

import { Button } from 'primereact/button';
import { PageHeader } from '@/components/layout/page-header';
import { StateBlock } from '@/components/common/state-block';
import { ROUTES } from '@/config/app-routes';
import { useGeneratedProductCode } from '@/hooks/api/product/use-products';
import { errorMessage } from '@/lib/api/error-messages';
import { ProductForm } from './form/product-form';
import { EMPTY_FORM } from './form/product-form-schema';

/** 8.1.1 상품 등록: the product code comes from the API first (GET /products/generate-code). */
export function ProductCreate() {
  const code = useGeneratedProductCode(true);
  return (
    <>
      <PageHeader
        title="상품 등록"
        breadcrumb={[{ label: '쇼핑몰 관리' }, { label: '상품 관리', href: ROUTES.products }, { label: '상품 등록' }]}
      />
      {code.isLoading ? (
        <StateBlock variant="loading" title="상품코드를 생성하는 중입니다." />
      ) : code.isError || !code.data ? (
        <StateBlock
          variant="error"
          title="상품코드를 생성하지 못했습니다."
          description={errorMessage(code.error)}
          action={<Button label="다시 시도" onClick={() => void code.refetch()} />}
        />
      ) : (
        <ProductForm mode="create" initialValues={{ ...EMPTY_FORM, productCode: code.data }} />
      )}
    </>
  );
}

'use client';

import { Button } from 'primereact/button';
import { PageHeader } from '@/components/layout/page-header';
import { StateBlock } from '@/components/common/state-block';
import { ROUTES } from '@/config/app-routes';
import { useProductDetails } from '@/hooks/api/product/use-products';
import { errorMessage } from '@/lib/api/error-messages';
import { formatCategoryPath } from '@/lib/format';
import { ProductForm } from './form/product-form';
import { toFormValues } from './form/product-form-schema';

/** 8.1.2 상품 수정: loads the product, then the same multi-step form in edit mode. */
export function ProductEdit({ id }: { id: number }) {
  const details = useProductDetails(id);
  return (
    <>
      <PageHeader
        title="상품 수정"
        breadcrumb={[
          { label: '쇼핑몰 관리' },
          { label: '상품 관리', href: ROUTES.products },
          { label: '상품 상세', href: ROUTES.productDetails(id) },
          { label: '상품 수정' },
        ]}
      />
      {details.isLoading ? (
        <StateBlock variant="loading" title="상품 정보를 불러오는 중입니다." />
      ) : details.isError || !details.data ? (
        <StateBlock
          variant={details.error && 'kind' in details.error && details.error.kind === 'notFound' ? 'not-found' : 'error'}
          title="상품 정보를 불러오지 못했습니다."
          description={errorMessage(details.error)}
          action={<Button label="다시 시도" onClick={() => void details.refetch()} />}
        />
      ) : (
        <ProductForm
          // A refetch gives a fresh form only when the product itself changed.
          key={details.data.updatedAt}
          mode="edit"
          productId={id}
          initialValues={toFormValues(details.data)}
          erpCode={details.data.erpCode}
          categoryPath={formatCategoryPath(details.data.category?.name, details.data.subCategory?.name, details.data.childCategory?.name)}
        />
      )}
    </>
  );
}

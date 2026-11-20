'use client';

import { useMemo } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { QueryState } from '@/components/common/QueryState';
import { ProductForm } from './ProductForm';
import { useProductDetail } from './useProducts';
import { imageUrl } from './productService';
import { EMPTY_PRODUCT_FORM, type ProductFormValues } from './types';

/** Details returns full S3 URLs; the edit DTO expects keys like products/abc.png. */
function toKey(urlOrKey: string): string {
  if (!/^https?:/.test(urlOrKey)) return urlOrKey;
  try {
    return decodeURIComponent(new URL(urlOrKey).pathname.replace(/^\//, ''));
  } catch {
    return urlOrKey;
  }
}

export function ProductCreatePage() {
  return (
    <>
      <PageHeader title="상품 등록" crumbs={['쇼핑몰 관리', '상품 관리', '상품 등록']} />
      <ProductForm mode="create" initial={EMPTY_PRODUCT_FORM} />
    </>
  );
}

export function ProductEditPage({ id }: { id: number }) {
  const { data, isLoading, error, refetch } = useProductDetail(id);
  const initial: ProductFormValues | null = useMemo(
    () =>
      data
        ? {
            productName: data.productName,
            productCode: data.productCode,
            unitPrice: data.unitPrice,
            price: data.price,
            description: data.description,
            images: data.images.map((k) => ({ key: toKey(k), previewUrl: imageUrl(k) ?? '' })),
            isVisible: data.isVisible,
            onSale: data.onSale,
            categoryId: data.categoryId ?? null,
            subCategoryId: data.subCategoryId ?? null,
            childCategoryId: data.childCategoryId ?? null,
            erpName: data.erpName,
            erpUnitPrice: data.erpUnitPrice,
            quantity: data.quantity,
            taxType: data.taxType,
          }
        : null,
    [data],
  );
  return (
    <>
      <PageHeader title="상품 수정" crumbs={['쇼핑몰 관리', '상품 관리', '상품 수정']} />
      <QueryState isLoading={isLoading} error={error} onRetry={() => void refetch()} />
      {initial && <ProductForm mode="edit" productId={id} initial={initial} />}
    </>
  );
}

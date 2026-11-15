"use client";

import { PageHeading } from "@/components/common/PageHeading";
import { ErrorState, StateBlock } from "@/components/common/StateBlock";
import { ProductForm } from "@/components/products/ProductForm";
import { NAV_GROUP_LABEL } from "@/config/navigation";
import { useGenerateProductCode, useGetProductDetails } from "@/hooks/API/products/useGetProductDetails";
import { useCreateProduct, useUpdateProduct } from "@/hooks/API/products/useProductMutations";
import { EMPTY_PRODUCT_FORM, toFormValues } from "@/utils/product-rules";

/** /products/create: wait for the product code from the server, then show the empty form. */
export function ProductCreateScreen() {
  const code = useGenerateProductCode(true);
  const createProduct = useCreateProduct();

  return (
    <>
      <PageHeading title="상품 등록" breadcrumb={[NAV_GROUP_LABEL, "상품 관리", "등록"]} />
      {code.isPending ? (
        <StateBlock kind="loading" title="등록 화면을 준비하는 중입니다." />
      ) : code.isError ? (
        <ErrorState error={code.error} onRetry={() => code.refetch()} />
      ) : (
        <ProductForm
          mode="create"
          initialValues={{ ...EMPTY_PRODUCT_FORM, productCode: code.data }}
          saving={createProduct.isPending}
          saveError={createProduct.error}
          onSave={(request, done) => createProduct.mutate(request, { onSuccess: done })}
        />
      )}
    </>
  );
}

/** /products/[id]/edit: load the product, then show the form filled with it. */
export function ProductEditScreen({ id }: { id: number }) {
  const product = useGetProductDetails(id);
  const updateProduct = useUpdateProduct(id);

  return (
    <>
      <PageHeading title="상품 수정" breadcrumb={[NAV_GROUP_LABEL, "상품 관리", "수정"]} />
      {!Number.isInteger(id) || id <= 0 ? (
        <StateBlock kind="not-found" title="상품을 찾을 수 없습니다." />
      ) : product.isPending ? (
        <StateBlock kind="loading" title="상품을 불러오는 중입니다." />
      ) : product.isError ? (
        <ErrorState error={product.error} onRetry={() => product.refetch()} />
      ) : (
        <ProductForm
          // key: if the id changes, start a fresh form instead of keeping the previous product's values
          key={product.data.id}
          mode="edit"
          initialValues={toFormValues(product.data)}
          saving={updateProduct.isPending}
          saveError={updateProduct.error}
          onSave={(request, done) => updateProduct.mutate(request, { onSuccess: done })}
        />
      )}
    </>
  );
}

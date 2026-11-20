"use client";

import { PageHeader } from "@/components/layout/PageHeader";
import { useGeneratedCode, useProductDetail } from "@/hooks/useProductForm";
import { detailToForm } from "@/services/productForm";
import { errorMessage } from "@/lib/errors";
import { ApiError } from "@/services/http";
import { EMPTY_PRODUCT_FORM } from "@/types/productForm";
import btn from "@/components/ui/Button.module.scss";
import { ProductForm } from "./ProductForm";
import styles from "./ProductForm.module.scss";

/** Loads what the form needs (a new code, or the product to edit), then renders the form once. */
export function ProductFormPage({ productId }: { productId: number | null }) {
  const isEdit = productId !== null;
  const code = useGeneratedCode(!isEdit);
  const detail = useProductDetail(productId);
  const query = isEdit ? detail : code;
  const title = isEdit ? "상품 수정" : "상품 등록";

  if (query.isPending) {
    return (
      <>
        <PageHeader title={title} crumb={title} />
        <p className={styles["page-state"]} role="status">
          불러오는 중…
        </p>
      </>
    );
  }

  if (query.isError) {
    const notFound = query.error instanceof ApiError && (query.error.status === 404 || query.error.status === 400);
    return (
      <>
        <PageHeader title={title} crumb={title} />
        <div className={styles["page-state"]} role="alert">
          <p>{notFound ? "상품을 찾을 수 없습니다. 이미 삭제되었을 수 있습니다." : errorMessage(query.error)}</p>
          {!notFound && (
            <button type="button" className={`${btn.button} ${btn.outline}`} onClick={() => query.refetch()}>
              다시 시도
            </button>
          )}
        </div>
      </>
    );
  }

  const initialValues = isEdit && detail.data ? detailToForm(detail.data) : { ...EMPTY_PRODUCT_FORM, productCode: code.data ?? "" };
  return <ProductForm key={productId ?? "new"} mode={isEdit ? "edit" : "create"} productId={productId} initialValues={initialValues} />;
}

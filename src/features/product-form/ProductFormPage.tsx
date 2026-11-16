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
  const title = isEdit ? "Edit Product" : "Product Registration";

  if (query.isPending) {
    return (
      <>
        <PageHeader title={title} crumb={title} />
        <p className={styles.pageState} role="status">
          Loading…
        </p>
      </>
    );
  }

  if (query.isError) {
    const notFound = query.error instanceof ApiError && (query.error.status === 404 || query.error.status === 400);
    return (
      <>
        <PageHeader title={title} crumb={title} />
        <div className={styles.pageState} role="alert">
          <p>{notFound ? "This product doesn't exist or was deleted." : errorMessage(query.error)}</p>
          {!notFound && (
            <button type="button" className={`${btn.button} ${btn.outline}`} onClick={() => query.refetch()}>
              Try again
            </button>
          )}
        </div>
      </>
    );
  }

  const initialValues = isEdit && detail.data ? detailToForm(detail.data) : { ...EMPTY_PRODUCT_FORM, productCode: code.data ?? "" };
  return <ProductForm key={productId ?? "new"} mode={isEdit ? "edit" : "create"} productId={productId} initialValues={initialValues} />;
}

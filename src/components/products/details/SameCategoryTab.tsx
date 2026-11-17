"use client";

import Link from "next/link";
import { StateWrapper, TableSkeleton } from "@/components";
import type { ProductDetails } from "@/api-services/ProductService.types";
import { useGetProductDetails } from "@/hooks/API/products/useGetProductDetails";
import { useGetProductList } from "@/hooks/API/products/useGetProductList";
import { formatCategoryPath, formatNumber, formatWon } from "@/utils/format";
import ProductThumbnail from "../list/ProductThumbnail";
import { DEFAULT_LIST_STATE, toSearchString } from "../list/list-url-state";
import { PRODUCT_ROUTES } from "../list/product-routes";

/** First page of the minor category (the API returns newest first). */
const RELATED_LIMIT = 10;

// Its own list query: other products of the same minor category (the product itself is left out).
// Only mounted once the product (and so its minor category) is known — the list hook has no
// "enabled" flag, and an unfiltered list must never be requested by mistake.
function RelatedProducts({ product }: { product: ProductDetails & { childCategory: { id: number; name: string } } }) {
  const related = useGetProductList({
    searchType: "productName",
    page: 1,
    limit: RELATED_LIMIT,
    childCategoryId: product.childCategory.id,
  });
  const others = (related.data?.items ?? []).filter((row) => row.id !== product.id);
  const othersTotal = Math.max(0, (related.data?.totalRecords ?? 0) - 1);
  const path = formatCategoryPath(product.category, product.subCategory, product.childCategory);
  const search = toSearchString({
    ...DEFAULT_LIST_STATE,
    categoryId: product.category?.id ?? null,
    subCategoryId: product.subCategory?.id ?? null,
    childCategoryId: product.childCategory.id,
  });

  return (
    <StateWrapper
      isLoading={related.isPending}
      isError={related.isError}
      error={related.error}
      onRetry={() => void related.refetch()}
      isEmpty={others.length === 0}
      loadingFallback={<TableSkeleton rows={4} columns={3} label="Loading products of this category…" />}
      emptyTitle="No other products"
      emptyDescription={`No other product is registered in ${path}.`}
    >
      <p className="related-summary">
        {formatNumber(othersTotal)} other product{othersTotal === 1 ? "" : "s"} in <strong>{path}</strong>
        {othersTotal > others.length && ` — the newest ${others.length} are shown`}.{" "}
        <Link href={`${PRODUCT_ROUTES.list}${search ? `?${search}` : ""}`}>Open in product list</Link>
      </p>
      <ul className="related-products">
        {others.map((row) => (
          <li key={row.id} className="related-product">
            <ProductThumbnail src={row.image} />
            <div className="related-product-text">
              <Link href={PRODUCT_ROUTES.details(row.id)} className="product-name-link">
                {row.productName}
              </Link>
              <span className="related-product-meta">
                {row.productCode || "-"} · {formatWon(row.unitPrice)}
              </span>
            </div>
            <span className={`product-badge${row.isVisible ? " is-on" : ""}`}>{row.isVisible ? "Visible" : "Hidden"}</span>
          </li>
        ))}
      </ul>
    </StateWrapper>
  );
}

// Same-category tab: waits for the product (shared details query), then loads its own list.
// A failing list only shows its error here — the other tabs keep working.
export default function SameCategoryTab({ productId }: { productId: number }) {
  const details = useGetProductDetails(productId);
  const product = details.data;
  const childCategory = product?.childCategory;

  return (
    <StateWrapper
      isLoading={details.isPending}
      isError={details.isError}
      error={details.error}
      onRetry={() => void details.refetch()}
      isEmpty={!!product && !childCategory?.id}
      loadingFallback={<TableSkeleton rows={4} columns={3} label="Loading product…" />}
      emptyTitle="No minor category"
      emptyDescription="This product has no minor category, so there are no related products to show."
    >
      {product && childCategory?.id ? <RelatedProducts product={{ ...product, childCategory }} /> : null}
    </StateWrapper>
  );
}

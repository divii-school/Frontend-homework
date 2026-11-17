"use client";

import type { ReactNode } from "react";
import { StateWrapper, TableSkeleton } from "@/components";
import type { ProductDetails } from "@/api-services/ProductService.types";
import { useGetProductDetails } from "@/hooks/API/products/useGetProductDetails";
import { EMPTY_VALUE, formatCategoryPath, formatDateTime, formatNumber, formatWon } from "@/utils/format";
import ProductGallery from "./ProductGallery";

interface InfoItem {
  label: string;
  value: ReactNode;
}

const TAX_LABELS: Record<string, string> = { tax: "과세", tax_free: "비과세" };

function YesNoBadge({ value }: { value: boolean }) {
  return <span className={`product-badge${value ? " is-on" : ""}`}>{value ? "예" : "아니오"}</span>;
}

/** Descriptions may come from the legacy system as HTML: show the text only, never run the markup. */
function toPlainText(value: string | null | undefined): string {
  if (!value) return "";
  if (!/<[a-z][\s\S]*>/i.test(value) || typeof DOMParser === "undefined") return value;
  const withBreaks = value.replace(/<br\s*\/?>/gi, "\n").replace(/<\/p>/gi, "\n");
  return (new DOMParser().parseFromString(withBreaks, "text/html").body.textContent ?? "").trim();
}

// One titled group of label / value pairs (<dl>).
function InfoSection({ title, items }: { title: string; items: InfoItem[] }) {
  return (
    <section className="product-info-section">
      <h2 className="product-section-title">{title}</h2>
      <dl className="product-info-list">
        {items.map((item) => (
          <div className="product-info-item" key={item.label}>
            <dt>{item.label}</dt>
            <dd>{item.value === "" || item.value === null || item.value === undefined ? EMPTY_VALUE : item.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function Overview({ product }: { product: ProductDetails }) {
  const description = toPlainText(product.description);
  return (
    <div className="product-overview">
      <ProductGallery images={product.images} productName={product.productName} />
      <div className="product-overview-info">
        <InfoSection
          title="기본 정보"
          items={[
            { label: "상품명", value: product.productName },
            { label: "상품코드", value: product.productCode },
            { label: "상품 유형", value: product.isOptions ? "메인 상품 (옵션 있음)" : "단권 상품" },
            { label: "카테고리", value: formatCategoryPath(product.category, product.subCategory, product.childCategory) },
            { label: "등록일자", value: formatDateTime(product.createdAt) },
            { label: "수정일자", value: formatDateTime(product.updatedAt) },
          ]}
        />
        <InfoSection
          title="가격 및 상태"
          items={[
            { label: "단가", value: formatWon(product.price) },
            { label: "판매가", value: formatWon(product.unitPrice) },
            { label: "노출상태", value: <YesNoBadge value={product.isVisible} /> },
            { label: "판매상태", value: <YesNoBadge value={product.onSale} /> },
          ]}
        />
        <InfoSection
          title="ERP"
          items={[
            { label: "ERP 코드", value: product.erpCode },
            { label: "상품ERP명", value: product.erpName },
            { label: "갯수", value: formatNumber(product.quantity) },
            { label: "비과세", value: TAX_LABELS[product.taxType] ?? product.taxType },
            { label: "ERP 단가", value: formatWon(product.erpUnitPrice) },
          ]}
        />
        <section className="product-info-section">
          <h2 className="product-section-title">상세설명</h2>
          <p className="product-description">{description || EMPTY_VALUE}</p>
        </section>
      </div>
    </div>
  );
}

// Overview tab: images, codes, prices, status, category, ERP fields, description.
// Uses the details query (shared with the page header and the Options tab — one request).
export default function OverviewTab({ productId }: { productId: number }) {
  const details = useGetProductDetails(productId);
  return (
    <StateWrapper
      isLoading={details.isPending}
      isError={details.isError}
      error={details.error}
      onRetry={() => void details.refetch()}
      loadingFallback={<TableSkeleton rows={5} columns={2} label="상품 정보를 불러오는 중…" />}
    >
      {details.data && <Overview product={details.data} />}
    </StateWrapper>
  );
}

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

const TAX_LABELS: Record<string, string> = { tax: "Taxable", tax_free: "Tax-exempt" };

function YesNoBadge({ value }: { value: boolean }) {
  return <span className={`product-badge${value ? " is-on" : ""}`}>{value ? "Yes" : "No"}</span>;
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
          title="Basic information"
          items={[
            { label: "Product name", value: product.productName },
            { label: "Product code", value: product.productCode },
            { label: "Product type", value: product.isOptions ? "Main (with options)" : "Supplementary" },
            { label: "Category", value: formatCategoryPath(product.category, product.subCategory, product.childCategory) },
            { label: "Registered", value: formatDateTime(product.createdAt) },
            { label: "Last updated", value: formatDateTime(product.updatedAt) },
          ]}
        />
        <InfoSection
          title="Price and status"
          items={[
            { label: "List price", value: formatWon(product.price) },
            { label: "Selling price", value: formatWon(product.unitPrice) },
            { label: "Exposure status", value: <YesNoBadge value={product.isVisible} /> },
            { label: "Sales status", value: <YesNoBadge value={product.onSale} /> },
          ]}
        />
        <InfoSection
          title="ERP"
          items={[
            { label: "ERP code", value: product.erpCode },
            { label: "ERP name", value: product.erpName },
            { label: "Quantity", value: formatNumber(product.quantity) },
            { label: "Tax type", value: TAX_LABELS[product.taxType] ?? product.taxType },
            { label: "ERP unit price", value: formatWon(product.erpUnitPrice) },
          ]}
        />
        <section className="product-info-section">
          <h2 className="product-section-title">Description</h2>
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
      loadingFallback={<TableSkeleton rows={5} columns={2} label="Loading product…" />}
    >
      {details.data && <Overview product={details.data} />}
    </StateWrapper>
  );
}

import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductDetail } from "@/features/product-detail/ProductDetail";

export const metadata: Metadata = { title: "상품 상세 · 토킹클럽 관리자" };

export default async function ProductDetailPage({ params }: PageProps<"/shopping/products/[id]">) {
  const { id } = await params;
  const productId = Number(id);
  if (!Number.isInteger(productId) || productId <= 0) notFound();
  // The active tab is read from the URL (useSearchParams) → Suspense boundary.
  return (
    <Suspense>
      <ProductDetail productId={productId} />
    </Suspense>
  );
}

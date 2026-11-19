import { Suspense } from "react";
import type { Metadata } from "next";
import { PageHeader, PageLoader } from "@/components";
import { getBreadcrumb, ROUTE_KEYS } from "@/config/navigation";
import ProductForm from "@/components/products/form/ProductForm";

export const metadata: Metadata = { title: "상품 등록" };

// 8.1.1 Product registration — 4-step form, current step in ?step=1..4.
// Suspense: the form reads ?step with useSearchParams.
export default function ProductCreatePage() {
  return (
    <>
      <PageHeader title="상품 등록" breadcrumb={getBreadcrumb(ROUTE_KEYS.PRODUCTS, "상품 등록")} />
      <Suspense fallback={<PageLoader label="입력 화면을 불러오는 중…" />}>
        <ProductForm mode="create" />
      </Suspense>
    </>
  );
}

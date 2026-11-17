import { Suspense } from "react";
import type { Metadata } from "next";
import { PageHeader, PageLoader } from "@/components";
import CategoryManager from "@/components/categories/CategoryManager";
import { getBreadcrumb, ROUTE_KEYS } from "@/config/navigation";

export const metadata: Metadata = { title: "상품 카테고리 관리" };

// 8.2.0 Product Category Management (SUPER / MASTER admin; GENERAL_ADMIN with the category permission).
// CategoryManager reads ?q= with useSearchParams, which needs a Suspense boundary.
export default function CategoriesPage() {
  return (
    <>
      <PageHeader title="상품 카테고리 관리" breadcrumb={getBreadcrumb(ROUTE_KEYS.CATEGORIES)} />
      <Suspense fallback={<PageLoader label="카테고리를 불러오는 중…" />}>
        <CategoryManager />
      </Suspense>
    </>
  );
}

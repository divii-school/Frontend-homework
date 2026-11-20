import { Suspense } from "react";
import type { Metadata } from "next";
import { ProductList } from "@/features/products/ProductList";

export const metadata: Metadata = { title: "상품 관리 · 토킹클럽 관리자" };

export default function ProductsPage() {
  // ProductList reads the table state from the URL (useSearchParams) → needs a Suspense boundary.
  return (
    <Suspense>
      <ProductList />
    </Suspense>
  );
}

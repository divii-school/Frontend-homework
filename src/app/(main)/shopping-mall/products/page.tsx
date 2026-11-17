import { Suspense } from "react";
import type { Metadata } from "next";
import { PageLoader } from "@/components";
import ProductListScreen from "@/components/products/list/ProductListScreen";

export const metadata: Metadata = { title: "Product Management" };

// 8.1.0 Product Management list. The screen reads its state from the URL (useSearchParams),
// which needs a Suspense boundary.
export default function ProductListPage() {
  return (
    <Suspense fallback={<PageLoader label="Loading product list…" />}>
      <ProductListScreen />
    </Suspense>
  );
}

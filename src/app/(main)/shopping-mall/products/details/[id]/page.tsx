import { Suspense } from "react";
import type { Metadata } from "next";
import { PageLoader } from "@/components";
import ProductDetailsScreen from "@/components/products/details/ProductDetailsScreen";

export const metadata: Metadata = { title: "Product Details" };

// Product details with tabs (?tab=overview|options|related). Not in the design — design question 4.
// The screen reads ?tab with useSearchParams, which needs a Suspense boundary.
export default async function ProductDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <Suspense fallback={<PageLoader label="Loading product…" />}>
      <ProductDetailsScreen idParam={id} />
    </Suspense>
  );
}

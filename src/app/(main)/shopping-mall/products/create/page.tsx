import { Suspense } from "react";
import type { Metadata } from "next";
import { PageHeader, PageLoader } from "@/components";
import { getBreadcrumb, ROUTE_KEYS } from "@/config/navigation";
import ProductForm from "@/components/products/form/ProductForm";

export const metadata: Metadata = { title: "Product Registration" };

// 8.1.1 Product registration — 4-step form, current step in ?step=1..4.
// Suspense: the form reads ?step with useSearchParams.
export default function ProductCreatePage() {
  return (
    <>
      <PageHeader title="Product Registration" breadcrumb={getBreadcrumb(ROUTE_KEYS.PRODUCTS, "Register")} />
      <Suspense fallback={<PageLoader label="Loading the form…" />}>
        <ProductForm mode="create" />
      </Suspense>
    </>
  );
}

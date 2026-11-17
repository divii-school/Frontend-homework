import { Suspense } from "react";
import type { Metadata } from "next";
import { PageHeader, PageLoader } from "@/components";
import { getBreadcrumb, ROUTE_KEYS } from "@/config/navigation";
import ProductEditScreen from "@/components/products/form/ProductEditScreen";

export const metadata: Metadata = { title: "Product Edit" };

// 8.1.2 Product edit — loads the product, then the same 4-step form (?step=1..4).
export default async function ProductEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <>
      <PageHeader title="Product Edit" breadcrumb={getBreadcrumb(ROUTE_KEYS.PRODUCTS, "Edit")} />
      <Suspense fallback={<PageLoader label="Loading the form…" />}>
        <ProductEditScreen id={Number(id)} />
      </Suspense>
    </>
  );
}

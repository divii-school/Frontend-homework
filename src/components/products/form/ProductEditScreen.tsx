"use client";

import Link from "next/link";
import { ErrorState, PageLoader } from "@/components";
import { useGetProductDetails } from "@/hooks/API/products/useGetProductDetails";
import ProductForm from "./ProductForm";

const LIST_HREF = "/shopping-mall/products";

// 8.1.2 Product edit: loads the product (GET /products/details/:id), then shows the same 4-step form.
// Loading → spinner, not found / deleted → 404 box, any other failure → error box with "Try again".
export default function ProductEditScreen({ id }: { id: number }) {
  const validId = Number.isInteger(id) && id > 0;
  const query = useGetProductDetails(validId ? id : null);

  const backToList = (
    <Link href={LIST_HREF} className="p-button p-button-outlined">
      Back to list
    </Link>
  );

  if (!validId) {
    return (
      <section className="content-card">
        <ErrorState variant="not-found" message="This product address is not valid." actions={backToList} />
      </section>
    );
  }
  if (query.isPending) {
    return (
      <section className="content-card">
        <PageLoader label="Loading the product…" />
      </section>
    );
  }
  if (query.isError) {
    return (
      <section className="content-card">
        <ErrorState
          error={query.error}
          onRetry={query.error.kind === "not-found" ? undefined : () => void query.refetch()}
          actions={backToList}
        />
      </section>
    );
  }
  // key → a different product id starts a fresh form
  return <ProductForm key={query.data.id} mode="edit" product={query.data} />;
}

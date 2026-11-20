import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductFormPage } from "@/features/product-form/ProductFormPage";

export const metadata: Metadata = { title: "상품 수정 · 토킹클럽 관리자" };

export default async function EditProductPage({ params }: PageProps<"/shopping/products/[id]/edit">) {
  const { id } = await params;
  const productId = Number(id);
  if (!Number.isInteger(productId) || productId <= 0) notFound();
  return <ProductFormPage productId={productId} />;
}

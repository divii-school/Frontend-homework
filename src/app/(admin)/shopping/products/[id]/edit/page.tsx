import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductFormPage } from "@/features/product-form/ProductFormPage";

export const metadata: Metadata = { title: "Edit Product · Talking Club Admin" };

export default async function EditProductPage({ params }: PageProps<"/shopping/products/[id]/edit">) {
  const { id } = await params;
  const productId = Number(id);
  if (!Number.isInteger(productId) || productId <= 0) notFound();
  return <ProductFormPage productId={productId} />;
}

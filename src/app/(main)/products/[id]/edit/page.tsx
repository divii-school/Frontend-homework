import type { Metadata } from "next";
import { ProductEditScreen } from "@/components/products/ProductFormScreens";

export const metadata: Metadata = { title: "상품 수정" };

export default async function ProductEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ProductEditScreen id={Number(id)} />;
}

import type { Metadata } from "next";
import { ProductFormPage } from "@/features/product-form/ProductFormPage";

export const metadata: Metadata = { title: "상품 등록 · 토킹클럽 관리자" };

export default function NewProductPage() {
  return <ProductFormPage productId={null} />;
}

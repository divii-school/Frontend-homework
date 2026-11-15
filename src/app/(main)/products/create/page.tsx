import type { Metadata } from "next";
import { ProductCreateScreen } from "@/components/products/ProductFormScreens";

export const metadata: Metadata = { title: "상품 등록" };

export default function ProductCreatePage() {
  return <ProductCreateScreen />;
}

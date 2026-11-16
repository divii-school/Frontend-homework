import type { Metadata } from "next";
import { ProductFormPage } from "@/features/product-form/ProductFormPage";

export const metadata: Metadata = { title: "Product Registration · Talking Club Admin" };

export default function NewProductPage() {
  return <ProductFormPage productId={null} />;
}

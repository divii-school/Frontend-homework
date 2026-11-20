import type { Metadata } from "next";
import { ProductsList } from "@/components/products/ProductsList";

export const metadata: Metadata = { title: "상품 관리" };

export default function ProductsPage() {
  return <ProductsList />;
}

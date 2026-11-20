import type { Metadata } from "next";
import { ProductDetailsScreen } from "@/components/products/ProductDetailsScreen";

export const metadata: Metadata = { title: "상품 상세" };

// [id] is a dynamic route: /products/20001 gives params.id = "20001". In Next.js 15 params is a Promise.
export default async function ProductDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ProductDetailsScreen id={Number(id)} />;
}

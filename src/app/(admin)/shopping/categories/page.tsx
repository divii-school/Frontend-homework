import type { Metadata } from "next";
import { CategoryManagement } from "@/features/product-categories/CategoryManagement";

export const metadata: Metadata = { title: "상품 카테고리 관리 · 토킹클럽 관리자" };

export default function ProductCategoriesPage() {
  return <CategoryManagement />;
}

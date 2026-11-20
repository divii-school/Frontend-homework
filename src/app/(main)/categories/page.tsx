import type { Metadata } from "next";
import { CategoryList } from "@/components/categories/CategoryList";

export const metadata: Metadata = { title: "상품 카테고리 관리" };

export default function CategoriesPage() {
  return <CategoryList />;
}

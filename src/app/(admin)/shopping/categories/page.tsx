import type { Metadata } from "next";
import { CategoryManagement } from "@/features/product-categories/CategoryManagement";

export const metadata: Metadata = { title: "Product Category Management · Talking Club Admin" };

export default function ProductCategoriesPage() {
  return <CategoryManagement />;
}

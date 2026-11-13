import type { Metadata } from 'next';
import { CategoryManagement } from '@/components/product-category/category-management';

export const metadata: Metadata = { title: '상품 카테고리 관리 | 토킹클럽 관리자' };

export default function CategoriesPage() {
  return <CategoryManagement />;
}

import type { Metadata } from 'next';
import { ProductList } from '@/components/product/product-list';

export const metadata: Metadata = { title: '상품 관리 | 토킹클럽 관리자' };

export default function ProductsPage() {
  return <ProductList />;
}

import type { Metadata } from 'next';
import { ProductCreate } from '@/components/product/product-create';

export const metadata: Metadata = { title: '상품 등록 | 토킹클럽 관리자' };

export default function ProductNewPage() {
  return <ProductCreate />;
}

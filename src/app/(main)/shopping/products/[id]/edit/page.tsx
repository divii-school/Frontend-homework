import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ProductEdit } from '@/components/product/product-edit';
import { parseProductId } from '@/lib/route-params';

export const metadata: Metadata = { title: '상품 수정 | 토킹클럽 관리자' };

export default async function ProductEditPage({ params }: { params: Promise<{ id: string }> }) {
  const id = parseProductId((await params).id);
  if (id === null) notFound();
  return <ProductEdit id={id} />;
}

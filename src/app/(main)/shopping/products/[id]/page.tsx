import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ProductDetails } from '@/components/product/product-details';
import { parseProductId } from '@/lib/route-params';

export const metadata: Metadata = { title: '상품 상세 | 토킹클럽 관리자' };

/** /shopping/products/[id] — [id] must be a positive whole number, else 404. */
export default async function ProductDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const id = parseProductId((await params).id);
  if (id === null) notFound();
  return <ProductDetails id={id} />;
}

import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { ProductDetailPage } from '@/features/products/ProductDetailPage';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const num = Number(id);
  if (!Number.isInteger(num) || num <= 0) notFound();
  return (
    <Suspense fallback={null}>
      <ProductDetailPage id={num} />
    </Suspense>
  );
}

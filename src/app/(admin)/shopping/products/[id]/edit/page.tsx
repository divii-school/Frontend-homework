import { notFound } from 'next/navigation';
import { ProductEditPage } from '@/features/products/ProductEditPage';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const num = Number(id);
  if (!Number.isInteger(num) || num <= 0) notFound();
  return <ProductEditPage id={num} />;
}

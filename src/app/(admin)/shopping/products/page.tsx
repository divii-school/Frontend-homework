import { Suspense } from 'react';
import { ProductListPage } from '@/features/products/ProductListPage';

export default function Page() {
  return (
    <Suspense fallback={null}>
      <ProductListPage />
    </Suspense>
  );
}

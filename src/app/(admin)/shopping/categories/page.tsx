import { Suspense } from 'react';
import { CategoryManagementPage } from '@/features/categories/CategoryManagementPage';

export default function Page() {
  return (
    <Suspense fallback={null}>
      <CategoryManagementPage />
    </Suspense>
  );
}

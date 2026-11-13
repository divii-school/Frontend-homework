import Link from 'next/link';
import { ROUTES } from '@/config/app-routes';
import { StateBlock } from '@/components/common/state-block';

/** 404 for any URL that has no page. */
export default function NotFound() {
  return (
    <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
      <StateBlock
        variant="not-found"
        title="404 · 페이지를 찾을 수 없습니다."
        description="주소가 바뀌었거나 삭제된 페이지입니다."
        action={
          <Link href={ROUTES.home} className="p-button p-component">
            상품 관리로 이동
          </Link>
        }
      />
    </main>
  );
}

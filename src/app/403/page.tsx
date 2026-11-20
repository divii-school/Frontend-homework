'use client';

import Link from 'next/link';
import { useAuth } from '@/features/auth/AuthProvider';
import { homeFor } from '@/config/access';

export default function ForbiddenPage() {
  const { profile, status, logout } = useAuth();
  const home = homeFor(profile?.role);
  return (
    <main className="page-center" id="main">
      <h1>403</h1>
      {/* Figma 권한없음 팝업 문구 */}
      <p>
        관리자 권한이 없습니다.
        <br />
        고객센터로 문의해주세요.
        <br />
        02-2014-8374
      </p>
      {status === 'authenticated' && home !== '/403' ? (
        <Link href={home}>접근 가능한 화면으로 이동</Link>
      ) : (
        <button type="button" className="p-button" onClick={() => void logout()}>
          로그인 화면으로
        </button>
      )}
    </main>
  );
}

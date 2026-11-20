import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="page-center" id="main">
      <h1>404</h1>
      <p>요청하신 페이지를 찾을 수 없습니다.</p>
      <Link href="/">홈으로 이동</Link>
    </main>
  );
}

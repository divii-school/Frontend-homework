'use client';

export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="page-center" id="main" role="alert">
      <h1>오류가 발생했습니다</h1>
      <p>잠시 후 다시 시도해 주세요.</p>
      <button type="button" className="p-button" onClick={reset}>
        다시 시도
      </button>
    </main>
  );
}

import Link from "next/link";
import type { Metadata } from "next";
import { BrandLogo, ErrorState } from "@/components";
import { DEFAULT_HOME } from "@/config/navigation";

export const metadata: Metadata = { title: "페이지를 찾을 수 없습니다" };

// App-level 404 (unknown URL, or notFound() from a page).
export default function NotFound() {
  return (
    <main className="full-page">
      <section className="error-page-card">
        <div className="error-page-brand">
          <BrandLogo />
        </div>
        <ErrorState
          variant="not-found"
          titleAs="h1"
          title="페이지를 찾을 수 없습니다"
          message="요청하신 페이지가 존재하지 않거나 이동되었습니다."
          actions={
            <Link href={DEFAULT_HOME} className="p-button p-component">
              <span className="p-button-label">상품 관리로 이동</span>
            </Link>
          }
        />
      </section>
    </main>
  );
}

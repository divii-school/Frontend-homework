import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "@/components/auth/LoginForm";
import { BrandLogo } from "@/components/common/BrandLogo";

export const metadata: Metadata = { title: "로그인" };

/**
 * The card and the logo are drawn by the server, so they are on screen at once; the form inside appears when
 * React starts in the browser. Suspense: LoginForm reads ?redirect= with useSearchParams, which Next.js only
 * allows inside a Suspense boundary.
 */
export default function LoginPage() {
  return (
    <main className="login-page">
      <section className="login-card" aria-labelledby="login-title">
        <BrandLogo className="login-logo" priority />
        <h1 className="visually-hidden" id="login-title">
          관리자 로그인
        </h1>
        <Suspense fallback={null}>
          <LoginForm />
        </Suspense>
      </section>
    </main>
  );
}

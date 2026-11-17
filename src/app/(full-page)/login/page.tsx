import { Suspense } from "react";
import type { Metadata } from "next";
import LoginForm from "@/components/auth/LoginForm";
import { PageLoader } from "@/components";

export const metadata: Metadata = { title: "로그인" };

// 1.1.0 Login. LoginForm reads ?returnTo with useSearchParams, which needs a Suspense boundary.
export default function LoginPage() {
  return (
    <Suspense fallback={<PageLoader label="로그인 화면을 불러오는 중…" />}>
      <LoginForm />
    </Suspense>
  );
}

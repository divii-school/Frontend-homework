import { Suspense } from "react";
import type { Metadata } from "next";
import { LoginForm } from "@/features/auth/LoginForm";
import styles from "./page.module.scss";

export const metadata: Metadata = { title: "로그인 · 토킹클럽 관리자" };

export default function LoginPage() {
  return (
    <main className={styles.page}>
      {/* LoginForm reads ?next= with useSearchParams, which needs a Suspense boundary. */}
      <Suspense>
        <LoginForm />
      </Suspense>
    </main>
  );
}

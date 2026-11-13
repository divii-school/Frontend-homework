import { Suspense } from "react";
import type { Metadata } from "next";
import { LoginForm } from "@/features/auth/LoginForm";
import styles from "./page.module.scss";

export const metadata: Metadata = { title: "Log in · Talking Club Admin" };

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

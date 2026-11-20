"use client";

import Link from "next/link";
import { useAuth } from "@/features/auth/AuthProvider";
import { homeFor } from "@/config/navigation";
import btn from "@/components/ui/Button.module.scss";
import styles from "./Forbidden.module.scss";

/** 403 page. Copy follows the Figma "권한없음" (no permission) popup. */
export function Forbidden() {
  const { user } = useAuth();
  const home = user ? homeFor(user.role) : undefined;

  return (
    <section className={styles.wrap} aria-labelledby="forbidden-title">
      <p className={styles.code} aria-hidden>
        403
      </p>
      <h1 id="forbidden-title" className={styles.title}>
        이 페이지에 접근할 권한이 없습니다.
      </h1>
      <p className={styles.body}>
        고객센터로 문의해 주세요.
        <br />
        <a href="tel:0220148374">02-2014-8374</a>
      </p>
      {home && (
        <Link href={home} className={`${btn.button} ${btn.primary}`}>
          관리자 홈으로 이동
        </Link>
      )}
    </section>
  );
}

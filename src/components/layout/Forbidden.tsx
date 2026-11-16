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
        You don&apos;t have permission to open this page.
      </h1>
      <p className={styles.body}>
        Please contact customer service.
        <br />
        <a href="tel:0220148374">02-2014-8374</a>
      </p>
      {home && (
        <Link href={home} className={`${btn.button} ${btn.primary}`}>
          Go to my admin home
        </Link>
      )}
    </section>
  );
}

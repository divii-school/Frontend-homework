"use client";

import { useEffect, useId, useState, type FormEvent } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Dialog } from "primereact/dialog";
import { NotAdminError, useAuth } from "@/features/auth/AuthProvider";
import btn from "@/components/ui/Button.module.scss";
import { safeReturnPath } from "@/lib/auth/redirect";
import { errorMessage } from "@/lib/errors";
import { IconAdmin, IconCheck, IconEye, IconEyeOff, IconLock } from "@/components/icons";
import styles from "./LoginForm.module.scss";

export function LoginForm() {
  const { status, login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = safeReturnPath(searchParams.get("next"));
  const expired = searchParams.get("expired") === "1";

  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notAdmin, setNotAdmin] = useState(false);

  const idFieldId = useId();
  const pwFieldId = useId();
  const errorId = useId();

  // Already logged in → skip the form.
  useEffect(() => {
    if (status === "authenticated" && !submitting) router.replace(returnTo);
  }, [status, submitting, returnTo, router]);

  const canSubmit = loginId.trim() !== "" && password !== "" && !submitting;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      await login({ loginId: loginId.trim(), password, remember });
      router.replace(returnTo);
    } catch (err) {
      if (err instanceof NotAdminError) setNotAdmin(true);
      else setError(errorMessage(err));
      setSubmitting(false);
    }
  }

  const invalid = error !== null;

  return (
    <div className={styles.card}>
      <div className={styles.brand}>
        <Image
          src="/images/talkingclub-logo@2x.png"
          alt="토킹클럽"
          width={158}
          height={30}
          priority
          className={styles.logo}
        />
      </div>

      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <h1 className="visually-hidden">토킹클럽 관리자 로그인</h1>
        {expired && !error && (
          <p className={styles.notice} role="status">
            로그인이 만료되었습니다. 다시 로그인해 주세요.
          </p>
        )}

        <div className={styles.fields}>
          <div className={styles.field}>
            <div className={`${styles.input} ${invalid ? styles["input-invalid"] : ""}`}>
              <IconAdmin className={styles.icon} />
              <label htmlFor={idFieldId} className="visually-hidden">
                아이디
              </label>
              <input
                id={idFieldId}
                name="loginId"
                type="text"
                autoComplete="username"
                placeholder="아이디"
                value={loginId}
                onChange={(e) => {
                  setLoginId(e.target.value);
                  setError(null);
                }}
                aria-invalid={invalid}
                aria-describedby={invalid ? errorId : undefined}
                maxLength={100}
                required
              />
            </div>
          </div>

          <div className={styles.field}>
            <div className={`${styles.input} ${invalid ? styles["input-invalid"] : ""}`}>
              <IconLock className={styles.icon} />
              <label htmlFor={pwFieldId} className="visually-hidden">
                비밀번호
              </label>
              <input
                id={pwFieldId}
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="비밀번호"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(null);
                }}
                aria-invalid={invalid}
                aria-describedby={invalid ? errorId : undefined}
                maxLength={100}
                required
              />
              <button
                type="button"
                className={styles.reveal}
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "비밀번호 숨기기" : "비밀번호 보기"}
                aria-pressed={showPassword}
              >
                {showPassword ? <IconEye /> : <IconEyeOff />}
              </button>
            </div>
            <p id={errorId} className={styles.error} role="alert">
              {error}
            </p>
          </div>

          <label className={styles.check}>
            <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
            <span className={styles["check-box"]} aria-hidden>
              <IconCheck />
            </span>
            <span>자동 로그인</span>
          </label>
        </div>

        <button type="submit" className={styles.submit} disabled={!canSubmit} aria-busy={submitting}>
          {submitting ? "로그인 중…" : "로그인"}
        </button>
      </form>

      {/* Figma "권한없음" popup: valid account without an admin role. */}
      <Dialog
        visible={notAdmin}
        header="권한 없음"
        onHide={() => setNotAdmin(false)}
        draggable={false}
        resizable={false}
        footer={
          <button type="button" className={`${btn.button} ${btn.primary}`} onClick={() => setNotAdmin(false)}>
            확인
          </button>
        }
      >
        <p className={styles["popup-body"]}>
          관리자 권한이 없습니다.
          <br />
          고객센터로 문의해 주세요.
          <br />
          <br />
          02-2014-8374
        </p>
      </Dialog>
    </div>
  );
}

"use client";

import { useEffect, useId, useState, type FormEvent } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/features/auth/AuthProvider";
import { safeReturnPath } from "@/lib/auth/redirect";
import { errorMessage } from "@/lib/errors";
import { IconAdmin, IconCheck, IconEye, IconEyeOff, IconLock } from "@/components/icons";
import styles from "./LoginForm.module.scss";

export function LoginForm() {
  const { status, login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = safeReturnPath(searchParams.get("next"));

  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      setError(errorMessage(err));
      setSubmitting(false);
    }
  }

  const invalid = error !== null;

  return (
    <div className={styles.card}>
      <div className={styles.brand}>
        <Image
          src="/images/talkingclub-logo@2x.png"
          alt="Talking Club"
          width={158}
          height={30}
          priority
          className={styles.logo}
        />
        <span className={styles.brandDivider} aria-hidden />
        <span className={styles.brandLabel}>Admin</span>
      </div>

      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <h1 className="visually-hidden">Log in to Talking Club Admin</h1>

        <div className={styles.fields}>
          <div className={styles.field}>
            <div className={`${styles.input} ${invalid ? styles.inputInvalid : ""}`}>
              <IconAdmin className={styles.icon} />
              <label htmlFor={idFieldId} className="visually-hidden">
                ID
              </label>
              <input
                id={idFieldId}
                name="loginId"
                type="text"
                autoComplete="username"
                placeholder="ID"
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
            <div className={`${styles.input} ${invalid ? styles.inputInvalid : ""}`}>
              <IconLock className={styles.icon} />
              <label htmlFor={pwFieldId} className="visually-hidden">
                Password
              </label>
              <input
                id={pwFieldId}
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="Password"
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
                aria-label={showPassword ? "Hide password" : "Show password"}
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
            <span className={styles.checkBox} aria-hidden>
              <IconCheck />
            </span>
            <span>Auto login</span>
          </label>
        </div>

        <button type="submit" className={styles.submit} disabled={!canSubmit} aria-busy={submitting}>
          {submitting ? "Logging in…" : "Log in"}
        </button>
      </form>
    </div>
  );
}

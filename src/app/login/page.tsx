'use client';

import { Suspense, useEffect, useState, type FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { InputText } from 'primereact/inputtext';
import { Checkbox } from 'primereact/checkbox';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { ApiError } from '@/lib/api/client';
import { canAccessPath, homeFor, type Role } from '@/config/access';
import { useAuth } from '@/features/auth/AuthProvider';
import styles from './login.module.scss';

/** Only same-app relative paths are allowed as returnTo (no open redirect). */
function safeReturnTo(raw: string | null): string | null {
  if (!raw || !raw.startsWith('/') || raw.startsWith('//') || raw.startsWith('/login')) return null;
  return raw;
}

function LoginForm() {
  const { login, status, profile } = useAuth();
  const router = useRouter();
  const returnTo = safeReturnTo(useSearchParams().get('returnTo'));

  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [persist, setPersist] = useState(false);
  const [touched, setTouched] = useState({ loginId: false, password: false });
  const [submitting, setSubmitting] = useState(false);
  const [alertMsg, setAlertMsg] = useState<string | null>(null);

  const idError = touched.loginId && !loginId.trim() ? '아이디를 입력해 주세요.' : '';
  const pwError = touched.password && !password ? '비밀번호를 입력해 주세요.' : '';
  const canSubmit = loginId.trim() !== '' && password !== '' && !submitting;

  const go = (role: Role) => {
    const target = returnTo && canAccessPath(role, returnTo.split('?')[0]) ? returnTo : homeFor(role);
    router.replace(target);
  };

  // Already logged in → leave the login page.
  useEffect(() => {
    if (status === 'authenticated' && profile) go(profile.role);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, profile]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setTouched({ loginId: true, password: true });
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const p = await login({ loginId: loginId.trim(), password }, persist);
      go(p.role);
    } catch (err) {
      // Show the API's own message (등록되지 않은 계정 / 비밀번호 불일치 등).
      setAlertMsg(err instanceof ApiError || err instanceof Error ? err.message : '로그인에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className={styles.page} id="main">
      <form className={styles.card} onSubmit={onSubmit} noValidate aria-labelledby="login-title">
        <div className={styles.brand}>
          <i className="pi pi-comments" aria-hidden="true" />
          <span>TalkingClub</span>
        </div>
        <h1 id="login-title" className="sr-only">
          로그인
        </h1>

        <div className={styles.field}>
          <label htmlFor="loginId" className="sr-only">
            아이디
          </label>
          <InputText
            id="loginId"
            name="loginId"
            autoComplete="username"
            placeholder="아이디를 입력해 주세요."
            value={loginId}
            onChange={(e) => setLoginId(e.target.value)}
            onBlur={() => setTouched((t) => ({ ...t, loginId: true }))}
            className={idError ? 'p-invalid' : ''}
            aria-invalid={!!idError}
            aria-describedby={idError ? 'loginId-error' : undefined}
          />
          {idError && (
            <small id="loginId-error" className="p-error">
              {idError}
            </small>
          )}
        </div>

        <div className={styles.field}>
          <label htmlFor="password" className="sr-only">
            비밀번호
          </label>
          <div className={styles.pwWrap}>
            <InputText
              id="password"
              name="password"
              type={showPw ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="비밀번호를 입력해 주세요."
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, password: true }))}
              className={pwError ? 'p-invalid' : ''}
              aria-invalid={!!pwError}
              aria-describedby={pwError ? 'password-error' : undefined}
            />
            <button
              type="button"
              className={styles.eye}
              onClick={() => setShowPw((v) => !v)}
              aria-label={showPw ? '비밀번호 숨기기' : '비밀번호 보기'}
              aria-pressed={showPw}
            >
              <i className={showPw ? 'pi pi-eye-slash' : 'pi pi-eye'} aria-hidden="true" />
            </button>
          </div>
          {pwError && (
            <small id="password-error" className="p-error">
              {pwError}
            </small>
          )}
        </div>

        <div className={styles.check}>
          <Checkbox inputId="persist" checked={persist} onChange={(e) => setPersist(!!e.checked)} />
          <label htmlFor="persist">자동 로그인</label>
        </div>

        <Button type="submit" label="로그인" className={styles.submit} disabled={!canSubmit} loading={submitting} />
      </form>

      <Dialog
        header="알림"
        visible={alertMsg !== null}
        onHide={() => setAlertMsg(null)}
        style={{ width: 'min(360px, 90vw)' }}
        footer={<Button label="확인" onClick={() => setAlertMsg(null)} autoFocus />}
      >
        <p>{alertMsg}</p>
      </Dialog>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/providers/auth-provider';
import { allowedRoutes } from '@/lib/auth/permissions';
import { safeReturnTo } from '@/lib/auth/return-to';
import { ApiError } from '@/lib/api/api-error';
import { errorMessage } from '@/lib/api/error-messages';
import { NoPermissionDialog } from './no-permission-dialog';
import styles from './login-form.module.scss';

/** Matches LoginDto: both required. Spaces around the ID are trimmed, never inside the password. */
const loginSchema = z.object({
  loginId: z.string().trim().min(1, '아이디를 입력해 주세요.'),
  password: z.string().min(1, '비밀번호를 입력해 주세요.'),
  remember: z.boolean(),
});
type LoginValues = z.infer<typeof loginSchema>;

/**
 * Login screen (Figma 1.1.0 로그인).
 * - Button disabled until both fields have text (design rule).
 * - Wrong ID → message under the ID; wrong password → under the password (Figma error states).
 * - A user with no shopping permission → "관리자 권한이 없습니다" popup (Figma 권한없음 팝업).
 * - After login → back to ?returnTo (the page they were on), else the product list.
 */
export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { login, logout } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [noPermission, setNoPermission] = useState(false);
  const sessionExpired = params.get('reason') === 'expired';

  const {
    register,
    handleSubmit,
    watch,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { loginId: '', password: '', remember: false },
  });

  const loginId = watch('loginId');
  const password = watch('password');
  const remember = watch('remember');
  const canSubmit = loginId.trim().length > 0 && password.length > 0 && !isSubmitting;

  const onSubmit = handleSubmit(async (values) => {
    try {
      const user = await login(values);
      if (allowedRoutes(user).length === 0) {
        await logout();
        setNoPermission(true);
        return;
      }
      router.replace(safeReturnTo(params.get('returnTo')));
    } catch (error) {
      const message = errorMessage(error);
      const key = error instanceof ApiError ? error.apiMessages[0] : undefined;
      // Unknown ID belongs under the ID field; everything else under the password.
      setError(key === 'invalidCredentials' ? 'loginId' : 'password', { message });
    }
  });

  return (
    <main className={styles['login-page']}>
      <form className={styles['login-card']} onSubmit={onSubmit} noValidate aria-labelledby="login-title">
        <h1 id="login-title" className={styles['login-logo']}>
          <Image src="/images/logo-talkingclub.png" alt="토킹클럽 TalkingClub" width={158} height={30} priority />
          <span className="sr-only">관리자 로그인</span>
        </h1>

        {sessionExpired && (
          <p className={styles['login-notice']} role="status">
            로그인이 만료되었습니다. 다시 로그인해 주세요.
          </p>
        )}

        <div className={styles['login-fields']}>
          <div className={styles['field']}>
            <label htmlFor="loginId" className="sr-only">
              아이디
            </label>
            <div className={`${styles['input-line']} ${errors.loginId ? styles['is-invalid'] : ''}`}>
              <Image src="/images/icon-administrator-gray.svg" alt="" width={18} height={18} aria-hidden />
              <input
                id="loginId"
                type="text"
                autoComplete="username"
                placeholder="아이디"
                aria-invalid={Boolean(errors.loginId)}
                aria-describedby={errors.loginId ? 'loginId-error' : undefined}
                {...register('loginId')}
              />
            </div>
            {errors.loginId && (
              <p id="loginId-error" className={styles['field-error']} role="alert">
                {errors.loginId.message}
              </p>
            )}
          </div>

          <div className={styles['field']}>
            <label htmlFor="password" className="sr-only">
              비밀번호
            </label>
            <div className={`${styles['input-line']} ${errors.password ? styles['is-invalid'] : ''}`}>
              <Image src="/images/icon-lock-gray.svg" alt="" width={18} height={18} aria-hidden />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="비밀번호"
                aria-invalid={Boolean(errors.password)}
                aria-describedby={errors.password ? 'password-error' : undefined}
                {...register('password')}
              />
              <button
                type="button"
                className={styles['eye-button']}
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
                aria-pressed={showPassword}
              >
                {showPassword ? (
                  <i className="pi pi-eye" aria-hidden />
                ) : (
                  <Image src="/images/icon-eye-ban-gray.svg" alt="" width={18} height={18} aria-hidden />
                )}
              </button>
            </div>
            {errors.password && (
              <p id="password-error" className={styles['field-error']} role="alert">
                {errors.password.message}
              </p>
            )}
          </div>

          <label className={styles['remember']}>
            <input type="checkbox" {...register('remember')} />
            <span className={`${styles['remember-box']} ${remember ? styles['is-checked'] : ''}`} aria-hidden>
              {remember && <i className="pi pi-check" />}
            </span>
            자동 로그인
          </label>
        </div>

        <button type="submit" className={styles['login-button']} disabled={!canSubmit} aria-busy={isSubmitting}>
          {isSubmitting ? '로그인 중…' : '로그인'}
        </button>
      </form>

      <NoPermissionDialog visible={noPermission} onClose={() => setNoPermission(false)} />
    </main>
  );
}

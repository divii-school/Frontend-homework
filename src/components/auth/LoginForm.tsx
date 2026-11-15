"use client";

import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Password } from "primereact/password";
import { useState, type FormEvent } from "react";
import { ErrorSummary } from "@/components/common/ErrorSummary";
import { FormField, invalidProps } from "@/components/common/FormField";
import { useAuth } from "@/components/providers/AuthProvider";
import { REDIRECT_PARAM } from "@/constants/auth";
import { LOGO } from "@/constants/design";
import { MESSAGES } from "@/constants/messages";
import { useLogin } from "@/hooks/API/auth/useAuthMutations";
import { safeRedirectPath } from "@/utils/session";

/**
 * Login screen. Flow: validate here -> POST /auth/login -> keep token (cookie) and user (localStorage)
 * -> go to the page in ?redirect= (the page the user wanted before being sent here), or the product list.
 */
export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signIn } = useAuth();
  const login = useLogin();
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  // Field errors appear after the first submit attempt, not while the user is still typing.
  const [submitted, setSubmitted] = useState(false);

  const errors = {
    loginId: loginId.trim() ? undefined : MESSAGES.required("아이디"),
    password: password ? undefined : MESSAGES.required("비밀번호"),
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    setSubmitted(true);
    if (errors.loginId || errors.password) return;
    login.mutate(
      { loginId: loginId.trim(), password },
      {
        onSuccess: ({ token, user }) => {
          signIn(token, user);
          router.replace(safeRedirectPath(searchParams.get(REDIRECT_PARAM)));
        },
      },
    );
  };

  return (
    <main className="login-page">
      <form className="login-card" onSubmit={handleSubmit} noValidate aria-labelledby="login-title">
        <Image className="login-logo" src={LOGO.src} alt="TalkingClub" width={LOGO.width} height={LOGO.height} priority />
        <h1 className="login-title" id="login-title">
          관리자 로그인
        </h1>
        <ErrorSummary error={login.error} />
        <FormField id="login-id" label="아이디" required error={submitted ? errors.loginId : undefined}>
          <InputText
            id="login-id"
            value={loginId}
            placeholder="아이디"
            autoComplete="username"
            onChange={(event) => setLoginId(event.target.value)}
            {...invalidProps("login-id", submitted ? errors.loginId : undefined)}
          />
        </FormField>
        <FormField id="login-password" label="비밀번호" required error={submitted ? errors.password : undefined}>
          <Password
            inputId="login-password"
            value={password}
            placeholder="비밀번호"
            feedback={false}
            toggleMask
            autoComplete="current-password"
            onChange={(event) => setPassword(event.target.value)}
            invalid={submitted && Boolean(errors.password)}
            pt={{ input: { "aria-describedby": submitted && errors.password ? "login-password-error" : undefined } }}
          />
        </FormField>
        <Button type="submit" className="login-submit" label="로그인" loading={login.isPending} disabled={login.isPending} />
      </form>
    </main>
  );
}

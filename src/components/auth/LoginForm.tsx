"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "primereact/button";
import { Checkbox } from "primereact/checkbox";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { Password } from "primereact/password";
import { useEffect, useState, type FormEvent } from "react";
import { FormField, invalidProps } from "@/components/common/FormField";
import { useAuth } from "@/components/providers/AuthProvider";
import { visibleNavItems } from "@/config/navigation";
import { REDIRECT_PARAM } from "@/constants/auth";
import { MESSAGES } from "@/constants/messages";
import { useLogin } from "@/hooks/API/auth/useAuthMutations";
import { safeRedirectPath } from "@/utils/session";

/** The popup of the live admin for an account without admin rights (login design 1.1.0). */
const NO_ADMIN_RIGHT = [MESSAGES.noAdminRight, MESSAGES.contactSupport];

/**
 * Login screen. Flow: validate here -> POST /auth/login -> keep token (cookie) and user (localStorage)
 * -> go to the page in ?redirect= (the page the user wanted before being sent here), or the product list.
 * A refused login (wrong ID or password, no admin rights) opens an alert closed with 확인; the typed values stay.
 * 자동 로그인 decides how long the token cookie lives: until the token expires, or until the browser closes.
 */
export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signIn } = useAuth();
  const login = useLogin();
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  // Field errors appear after the first submit attempt, not while the user is still typing.
  const [submitted, setSubmitted] = useState(false);
  // False in the server-rendered page, true once React runs in the browser. Until then a click on the button
  // would submit the form the browser's own way (a page reload that drops ?redirect=), so the button waits.
  const [interactive, setInteractive] = useState(false);
  useEffect(() => setInteractive(true), []);
  // Lines of the alert dialog (login design: a wrong ID or password opens an alert closed with 확인).
  const [alertLines, setAlertLines] = useState<readonly string[] | null>(null);

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
          // An account that may open no page of this admin is stopped here with the "no admin rights" popup,
          // instead of being let in to a 403 on every page. The token is simply not kept: calling the real
          // logout would end every session of the shared account.
          if (visibleNavItems(user).length === 0) {
            setAlertLines(NO_ADMIN_RIGHT);
            return;
          }
          signIn(token, user, remember);
          router.replace(safeRedirectPath(searchParams.get(REDIRECT_PARAM)));
        },
        onError: (error) => setAlertLines(error.code === "userSuspended" ? NO_ADMIN_RIGHT : error.messages),
      },
    );
  };

  return (
    <form className="login-form" onSubmit={handleSubmit} noValidate aria-labelledby="login-title">
      <Dialog
        className="login-alert"
        header="알림"
        visible={alertLines !== null}
        modal
        draggable={false}
        resizable={false}
        onHide={() => setAlertLines(null)}
        footer={<Button type="button" label="확인" autoFocus onClick={() => setAlertLines(null)} />}
      >
        {alertLines?.map((line) => (
          <p key={line} className="login-alert-line">
            {line}
          </p>
        ))}
      </Dialog>
      <FormField id="login-id" label="아이디" hideLabel error={submitted ? errors.loginId : undefined}>
        <span className="login-input">
          <i className="pi pi-user" aria-hidden="true" />
          <InputText
            id="login-id"
            aria-required
            value={loginId}
            placeholder="아이디"
            autoComplete="username"
            onChange={(event) => setLoginId(event.target.value)}
            {...invalidProps("login-id", submitted ? errors.loginId : undefined)}
          />
        </span>
      </FormField>
      <FormField id="login-password" label="비밀번호" hideLabel error={submitted ? errors.password : undefined}>
        <span className="login-input">
          <i className="pi pi-lock" aria-hidden="true" />
          <Password
            inputId="login-password"
            value={password}
            placeholder="비밀번호"
            feedback={false}
            toggleMask
            onChange={(event) => setPassword(event.target.value)}
            invalid={submitted && Boolean(errors.password)}
            pt={{
              input: {
                autoComplete: "current-password",
              "aria-required": true,
                "aria-describedby": submitted && errors.password ? "login-password-error" : undefined,
              },
            }}
          />
        </span>
      </FormField>
      <label className="login-remember" htmlFor="login-remember">
        <Checkbox inputId="login-remember" checked={remember} onChange={(event) => setRemember(Boolean(event.checked))} />
        자동 로그인
      </label>
      <Button type="submit" className="login-submit" label="로그인" loading={login.isPending} disabled={!interactive || login.isPending} />
    </form>
  );
}

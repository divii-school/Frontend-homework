"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { InputText } from "primereact/inputtext";
import { Checkbox } from "primereact/checkbox";
import { Button } from "primereact/button";
import { useQueryClient } from "@tanstack/react-query";
import AuthService from "@/api-services/AuthService";
import { toApiError } from "@/api-services/CoreAPIService";
import { firstAccessibleHref, isHqAdmin } from "@/config/navigation";
import { getApiMessage } from "@/utils/api-messages";
import { sanitizeReturnTo, saveSession } from "@/utils/session";
import BrandLogo from "../BrandLogo";
import AlertDialog from "../AlertDialog";
import NoPermissionDialog from "./NoPermissionDialog";

// Login card (design 1.1.0):
//  1 ID  2 password (masked, eye icon shows it)  3 Auto login  4 Login - disabled until both are filled.
//  - client checks: required (ID trimmed), shown under the field after it was touched
//  - API errors: invalidCredentials -> under the ID + alert "This account is not registered."
//                invalidPassword    -> under the password + alert "The ID and password do not match..."
//                anything else      -> alert with the mapped message
//  - success: only SUPER / MASTER / GENERAL admins with at least one page get a session; any other
//    role sees the "no admin permission" popup and nothing is stored (the token is logged out).
//  - then go to `returnTo` (same-site relative paths only) or the first page the user may open.

interface LoginValues {
  loginId: string;
  password: string;
  remember: boolean;
}

type AlertState = { message: string; focus: "loginId" | "password" | null } | null;

const FIELD_MESSAGES = {
  loginIdRequired: "Please enter your ID.",
  passwordRequired: "Please enter your password.",
  loginIdUnknown: "This ID is not registered.",
  passwordMismatch: "The password does not match.",
} as const;

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const [showPassword, setShowPassword] = useState(false);
  const [alert, setAlert] = useState<AlertState>(null);
  const [noPermission, setNoPermission] = useState(false);

  const {
    control,
    register,
    handleSubmit,
    watch,
    setError,
    setFocus,
    resetField,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    mode: "onTouched",
    // Design 1.1.0 shows "Auto login" ticked in every state, so it starts ticked
    defaultValues: { loginId: "", password: "", remember: true },
  });

  const loginId = watch("loginId");
  const password = watch("password");
  const canSubmit = loginId.trim().length > 0 && password.length > 0 && !isSubmitting;

  const onSubmit = async (values: LoginValues) => {
    try {
      const res = await AuthService.login({ loginId: values.loginId.trim(), password: values.password });
      const token = res.data?.token;
      const user = res.data?.user;
      if (!token || !user) {
        setAlert({ message: getApiMessage("serverError"), focus: null });
        return;
      }

      // Not an HQ admin (or an admin without any page of this app): popup, keep nothing
      if (!isHqAdmin(user) || !firstAccessibleHref(user)) {
        AuthService.logout(token).catch(() => {});
        resetField("password");
        setNoPermission(true);
        return;
      }

      saveSession(token, user, values.remember);
      queryClient.clear();
      const target = sanitizeReturnTo(searchParams.get("returnTo")) ?? firstAccessibleHref(user) ?? "/";
      router.replace(target);
    } catch (error) {
      const apiError = toApiError(error);
      if (apiError.messageKey === "invalidCredentials") {
        setError("loginId", { type: "server", message: FIELD_MESSAGES.loginIdUnknown });
        setAlert({ message: apiError.message, focus: "loginId" });
        return;
      }
      if (apiError.messageKey === "invalidPassword") {
        setError("password", { type: "server", message: FIELD_MESSAGES.passwordMismatch });
        setAlert({ message: apiError.message, focus: "password" });
        return;
      }
      if (apiError.fieldErrors?.loginId) setError("loginId", { type: "server", message: apiError.fieldErrors.loginId });
      if (apiError.fieldErrors?.password) setError("password", { type: "server", message: apiError.fieldErrors.password });
      setAlert({ message: apiError.message, focus: null });
    }
  };

  const closeAlert = () => {
    const focus = alert?.focus ?? null;
    setAlert(null);
    if (focus) window.setTimeout(() => setFocus(focus), 0);
  };

  const idError = errors.loginId?.message;
  const passwordError = errors.password?.message;

  return (
    <section className="login-card" aria-labelledby="login-title">
      <h1 id="login-title" className="sr-only">
        TalkingClub Admin login
      </h1>
      <div className="login-brand">
        <BrandLogo suffix="Admin" />
      </div>

      <form className="login-form" onSubmit={handleSubmit(onSubmit)} noValidate>
        {/* 1. ID */}
        <div className={idError ? "login-field login-field-invalid" : "login-field"}>
          <label htmlFor="login-id" className="sr-only">
            ID
          </label>
          <div className="login-input-row">
            <i className="login-input-icon pi pi-user" aria-hidden="true" />
            <InputText
              id="login-id"
              className="login-input"
              placeholder="ID"
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              aria-invalid={idError ? true : undefined}
              aria-describedby={idError ? "login-id-error" : undefined}
              {...register("loginId", {
                validate: (value) => value.trim().length > 0 || FIELD_MESSAGES.loginIdRequired,
              })}
            />
          </div>
          {idError && (
            <p id="login-id-error" className="field-error" role="alert">
              {idError}
            </p>
          )}
        </div>

        {/* 2. Password */}
        <div className={passwordError ? "login-field login-field-invalid" : "login-field"}>
          <label htmlFor="login-password" className="sr-only">
            Password
          </label>
          <div className="login-input-row">
            <i className="login-input-icon pi pi-lock" aria-hidden="true" />
            <InputText
              id="login-password"
              className="login-input"
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              autoComplete="current-password"
              aria-invalid={passwordError ? true : undefined}
              aria-describedby={passwordError ? "login-password-error" : undefined}
              {...register("password", { required: FIELD_MESSAGES.passwordRequired })}
            />
            <button
              type="button"
              className="login-eye-button"
              aria-label={showPassword ? "Hide password" : "Show password"}
              aria-pressed={showPassword}
              aria-controls="login-password"
              onClick={() => setShowPassword((current) => !current)}
            >
              <i className={showPassword ? "pi pi-eye" : "pi pi-eye-slash"} aria-hidden="true" />
            </button>
          </div>
          {passwordError && (
            <p id="login-password-error" className="field-error" role="alert">
              {passwordError}
            </p>
          )}
        </div>

        {/* 3. Auto login: ticked = session kept after the browser closes (localStorage); see utils/session.ts */}
        <Controller
          name="remember"
          control={control}
          render={({ field }) => (
            <label className="login-remember" htmlFor="login-remember">
              <Checkbox
                inputId="login-remember"
                checked={field.value}
                onChange={(event) => field.onChange(event.checked === true)}
              />
              Auto login
            </label>
          )}
        />

        {/* 4. Login */}
        <Button type="submit" className="login-submit" label="Login" loading={isSubmitting} disabled={!canSubmit} />
      </form>

      <AlertDialog visible={alert !== null} message={alert?.message ?? ""} onClose={closeAlert} />
      <NoPermissionDialog visible={noPermission} onClose={() => setNoPermission(false)} />
    </section>
  );
}

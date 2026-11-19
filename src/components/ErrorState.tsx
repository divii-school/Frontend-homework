"use client";

import type { ReactNode } from "react";
import { Button } from "primereact/button";
import { isApiError, type ApiErrorKind } from "@/types/api";

export type ErrorVariant = "forbidden" | "not-found" | "server" | "network" | "generic";

interface ErrorStateProps {
  /** Any thrown value; an ApiError picks the variant and message by itself. */
  error?: unknown;
  /** Force a variant (e.g. the 403 page). */
  variant?: ErrorVariant;
  title?: string;
  /** Overrides the message (default: the API's mapped message, or the variant's text). */
  message?: string;
  onRetry?: () => void;
  /** Extra buttons next to "Try again" (e.g. "Back to list"). */
  actions?: ReactNode;
  /** h1 on full pages (403 / 404 / app error), h2 inside a screen (default). */
  titleAs?: "h1" | "h2";
}

const VARIANTS: Record<ErrorVariant, { icon: string; title: string; message: string; code?: string }> = {
  forbidden: {
    icon: "pi pi-lock",
    title: "권한 없음",
    message: "이 화면을 볼 수 있는 권한이 없습니다. 권한이 필요하면 최고관리자에게 문의해 주세요.",
    code: "403",
  },
  "not-found": {
    icon: "pi pi-search",
    title: "찾을 수 없음",
    message: "존재하지 않거나 삭제된 항목입니다.",
    code: "404",
  },
  server: {
    icon: "pi pi-exclamation-triangle",
    title: "서버 오류",
    message: "서버 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.",
    code: "500",
  },
  network: {
    icon: "pi pi-wifi",
    title: "연결 오류",
    message: "서버에 연결할 수 없습니다. 네트워크 연결을 확인한 후 다시 시도해 주세요.",
  },
  generic: {
    icon: "pi pi-exclamation-circle",
    title: "데이터를 불러오지 못했습니다",
    message: "오류가 발생했습니다. 다시 시도해 주세요.",
  },
};

function variantFromKind(kind: ApiErrorKind): ErrorVariant {
  if (kind === "forbidden" || kind === "not-found" || kind === "server" || kind === "network") return kind;
  return "generic";
}

// Error block for a failed request: 403 / 404 / 500 / network / generic, with the server's
// (mapped) message and an optional retry. role="alert" so screen readers announce it.
export default function ErrorState({ error, variant, title, message, onRetry, actions, titleAs = "h2" }: ErrorStateProps) {
  const resolved: ErrorVariant = variant ?? (isApiError(error) ? variantFromKind(error.kind) : "generic");
  const preset = VARIANTS[resolved];
  const apiMessage = isApiError(error) && resolved === "generic" ? error.message : undefined;
  const code = isApiError(error) && error.status > 0 ? String(error.status) : preset.code;
  const Title = titleAs;

  return (
    <div className="state-box state-box-error" role="alert">
      <i className={`state-box-icon ${preset.icon}`} aria-hidden="true" />
      <Title className="state-box-title">{title ?? preset.title}</Title>
      <p className="state-box-description">{message ?? apiMessage ?? preset.message}</p>
      {code && <p className="state-box-code">오류 코드 {code}</p>}
      {(onRetry || actions) && (
        <div className="state-box-action">
          {onRetry && <Button type="button" label="다시 시도" icon="pi pi-refresh" outlined onClick={onRetry} />}
          {actions}
        </div>
      )}
    </div>
  );
}

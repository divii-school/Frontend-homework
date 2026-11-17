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
    title: "No permission",
    message: "Your account does not have permission to see this. Ask a super admin if you need access.",
    code: "403",
  },
  "not-found": {
    icon: "pi pi-search",
    title: "Not found",
    message: "This item does not exist or has been deleted.",
    code: "404",
  },
  server: {
    icon: "pi pi-exclamation-triangle",
    title: "Server error",
    message: "Something went wrong on the server. Please try again.",
    code: "500",
  },
  network: {
    icon: "pi pi-wifi",
    title: "Connection problem",
    message: "Cannot reach the server. Check your connection and try again.",
  },
  generic: {
    icon: "pi pi-exclamation-circle",
    title: "Could not load data",
    message: "Something went wrong. Please try again.",
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
      {code && <p className="state-box-code">Error code {code}</p>}
      {(onRetry || actions) && (
        <div className="state-box-action">
          {onRetry && <Button type="button" label="Try again" icon="pi pi-refresh" outlined onClick={onRetry} />}
          {actions}
        </div>
      )}
    </div>
  );
}

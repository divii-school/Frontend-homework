import { Button } from "primereact/button";
import type { ReactNode } from "react";
import type { ApiError } from "@/types/api";

type StateKind = "loading" | "empty" | "error" | "forbidden" | "not-found";

const ICONS: Record<StateKind, string> = {
  loading: "pi pi-spin pi-spinner",
  empty: "pi pi-inbox",
  error: "pi pi-exclamation-triangle",
  forbidden: "pi pi-lock",
  "not-found": "pi pi-search",
};

interface StateBlockProps {
  kind: StateKind;
  title: string;
  description?: string;
  /** Usually a "try again" or "back to list" button. */
  action?: ReactNode;
  /** True when the block is the whole page (404, 403, a crash): its title is then the page's h1. */
  isPage?: boolean;
}

/** The one block every screen uses for loading, empty, error, 403 and 404, so they look the same everywhere. */
export function StateBlock({ kind, title, description, action, isPage = false }: StateBlockProps) {
  return (
    <div className={`state-block state-block-${kind}`} role={kind === "error" ? "alert" : "status"} aria-live="polite">
      <i className={`state-block-icon ${ICONS[kind]}`} aria-hidden="true" />
      {isPage ? <h1 className="state-block-title">{title}</h1> : <p className="state-block-title">{title}</p>}
      {description && <p className="state-block-description">{description}</p>}
      {action && <div className="state-block-action">{action}</div>}
    </div>
  );
}

/** An API error as a state block: the API's own message, and "try again" when trying again can help. */
export function ErrorState({ error, onRetry }: { error: ApiError; onRetry?: () => void }) {
  const kind: StateKind = error.kind === "not-found" ? "not-found" : error.kind === "forbidden" ? "forbidden" : "error";
  const canRetry = onRetry && (error.kind === "network" || error.kind === "server" || error.kind === "unknown");
  return (
    <StateBlock
      kind={kind}
      title={error.messages[0]}
      description={error.messages.slice(1).join(" ") || undefined}
      action={canRetry ? <Button type="button" label="다시 시도" icon="pi pi-refresh" outlined onClick={onRetry} /> : undefined}
    />
  );
}

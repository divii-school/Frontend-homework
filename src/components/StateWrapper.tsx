import type { ReactNode } from "react";
import TableSkeleton from "./TableSkeleton";
import EmptyState from "./EmptyState";
import ErrorState from "./ErrorState";

interface StateWrapperProps {
  isLoading: boolean;
  isError?: boolean;
  /** The query's error — ErrorState shows the 403 / 404 / 500 / network variant from it. */
  error?: unknown;
  isEmpty?: boolean;
  onRetry?: () => void;
  /** Replace the default table skeleton (e.g. a card skeleton on a details tab). */
  loadingFallback?: ReactNode;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: ReactNode;
  emptyIcon?: string;
  children: ReactNode;
}

// Picks which of the four states a data block shows: loading → error → empty → filled.
// Every list / details / tab wraps its content in this so no state is forgotten.
//   <StateWrapper isLoading={q.isPending} isError={q.isError} error={q.error} onRetry={q.refetch}
//                 isEmpty={q.data?.items.length === 0}> …table… </StateWrapper>
export default function StateWrapper({
  isLoading,
  isError = false,
  error,
  isEmpty = false,
  onRetry,
  loadingFallback,
  emptyTitle,
  emptyDescription,
  emptyAction,
  emptyIcon,
  children,
}: StateWrapperProps) {
  if (isLoading) return <>{loadingFallback ?? <TableSkeleton />}</>;
  if (isError) return <ErrorState error={error} onRetry={onRetry} />;
  if (isEmpty) {
    return <EmptyState title={emptyTitle} description={emptyDescription} action={emptyAction} icon={emptyIcon} />;
  }
  return <>{children}</>;
}

import { isCancelledError, MutationCache, QueryCache, QueryClient } from "@tanstack/react-query";
import { isApiError } from "@/types/api";
import { getApiMessage } from "@/utils/api-messages";

// The app's QueryClient (created once in src/providers/AppProviders.tsx) and its DEFAULT ERROR TOAST.
//
// Every query and every mutation of the app ends up in one of the two caches below. When one fails,
// the cache shows an error toast — so a new screen that forgets to handle its error can not fail silently.
// A hook whose screens already show the error (inline through StateWrapper, under a field, or in their
// own toast) says so with `meta: SHOWS_OWN_ERROR`, and the default toast stays away (no double message).

const STALE_TIME_MS = 30_000;

/** Titles of the default error toast. The second line of the toast is the error's own message. */
export const DEFAULT_ERROR_TITLES = {
  query: "데이터를 불러오지 못했습니다",
  mutation: "요청을 처리하지 못했습니다",
} as const;

/** Put this in a hook's options (`meta: SHOWS_OWN_ERROR`) when its screens show the error themselves. */
export const SHOWS_OWN_ERROR = { showsOwnError: true } as const;

/** Shows one error toast (in the app: `useToast().error`). */
export type ShowErrorToast = (summary: string, detail: string) => void;

/** Retry once on network / 5xx; never on 4xx (validation, 401, 403, 404 won't fix themselves). */
function shouldRetry(failureCount: number, error: unknown): boolean {
  if (failureCount >= 1) return false;
  return isApiError(error) && (error.kind === "network" || error.kind === "server");
}

export function createQueryClient(showErrorToast: ShowErrorToast): QueryClient {
  // One rule for queries and mutations. No toast when:
  //  - the hook says its screens show the error themselves (meta)
  //  - the request was cancelled on purpose (nothing went wrong)
  //  - it is a 401: CoreAPIService is already sending the browser to the login page
  const toastUnlessHandled = (title: string, error: unknown, meta: Record<string, unknown> | undefined) => {
    if (meta?.showsOwnError === true || isCancelledError(error)) return;
    if (isApiError(error) && error.kind === "unauthorized") return;
    showErrorToast(title, isApiError(error) ? error.message : getApiMessage("serverError"));
  };

  return new QueryClient({
    // Called once per failed query, after its retries
    queryCache: new QueryCache({
      onError: (error, query) => toastUnlessHandled(DEFAULT_ERROR_TITLES.query, error, query.meta),
    }),
    mutationCache: new MutationCache({
      onError: (error, _variables, _context, mutation) => toastUnlessHandled(DEFAULT_ERROR_TITLES.mutation, error, mutation.meta),
    }),
    defaultOptions: {
      queries: { staleTime: STALE_TIME_MS, retry: shouldRetry, refetchOnWindowFocus: false },
      mutations: { retry: false },
    },
  });
}

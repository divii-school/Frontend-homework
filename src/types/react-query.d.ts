import '@tanstack/react-query';

/** Extra flags a query or mutation can carry (read by the global handlers in query-provider.tsx). */
interface AppQueryMeta extends Record<string, unknown> {
  /**
   * True when the screen shows this error itself (StateBlock, field error or its own toast).
   * Without it, a failure gets the default error toast, so no screen can fail silently.
   */
  handlesError?: boolean;
}

declare module '@tanstack/react-query' {
  interface Register {
    queryMeta: AppQueryMeta;
    mutationMeta: AppQueryMeta;
  }
}

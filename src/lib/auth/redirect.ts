export const LOGIN_PATH = "/login";
export const DEFAULT_AFTER_LOGIN = "/shopping/products";

/**
 * Only allow returning to a path inside this app ("/x/y?z"), never "//evil.com" or "https://…".
 */
export function safeReturnPath(value: string | null | undefined): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) {
    return DEFAULT_AFTER_LOGIN;
  }
  if (value === LOGIN_PATH || value.startsWith(`${LOGIN_PATH}?`)) return DEFAULT_AFTER_LOGIN;
  return value;
}

export function loginUrlFor(returnPath: string): string {
  return `${LOGIN_PATH}?next=${encodeURIComponent(returnPath)}`;
}

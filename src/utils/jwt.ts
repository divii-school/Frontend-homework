import type { JwtPayload } from "@/types/auth";

// JWT helpers shared by the browser and src/middleware.ts (Edge runtime) — no window / Node APIs,
// only atob + JSON. We never verify the signature here (the secret is server-side); the API does
// that on every call. We only read `exp` to send an expired session to /login early.

/** Decodes the payload part of a JWT, or null when it is not a readable token. */
export function decodeJwtPayload(token: string | null | undefined): JwtPayload | null {
  if (!token) return null;
  const part = token.split(".")[1];
  if (!part) return null;
  try {
    const base64 = part.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
    const parsed: unknown = JSON.parse(atob(padded));
    return parsed && typeof parsed === "object" ? (parsed as JwtPayload) : null;
  } catch {
    return null;
  }
}

/** Expiry time in ms since epoch, or null when the token carries no `exp`. */
export function getTokenExpiryMs(token: string | null | undefined): number | null {
  const exp = decodeJwtPayload(token)?.exp;
  return typeof exp === "number" ? exp * 1000 : null;
}

/** True when the token is missing, unreadable or past its `exp`. */
export function isTokenExpired(token: string | null | undefined, now: number = Date.now()): boolean {
  if (!token || !decodeJwtPayload(token)) return true;
  const expiry = getTokenExpiryMs(token);
  return expiry !== null && expiry <= now;
}

/** Every env variable is read here and nowhere else (WM Frontend Standard 5.5). */
export const env = {
  /** Talking Club QA API origin (no trailing slash, no /api/v1). Set in .env.local and in Vercel. */
  apiBaseUrl: (process.env.NEXT_PUBLIC_API_BASE_URL ?? "").replace(/\/+$/, ""),
} as const;

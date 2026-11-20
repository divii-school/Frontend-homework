/**
 * Public runtime config. NEXT_PUBLIC_* values are inlined at build time,
 * so they must be set in .env.local (local) or Vercel project settings (deploy).
 */
function required(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`Missing environment variable ${name}. Copy .env.example to .env.local.`);
  }
  return value;
}

export const env = {
  apiBaseUrl: required("NEXT_PUBLIC_API_BASE_URL", process.env.NEXT_PUBLIC_API_BASE_URL).replace(/\/+$/, ""),
} as const;

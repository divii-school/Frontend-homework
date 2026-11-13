/**
 * Runtime configuration. The API URL is never hard-coded: it comes from
 * NEXT_PUBLIC_API_BASE_URL (.env.local locally, Vercel project settings when deployed).
 * NEXT_PUBLIC_* values are inlined at build time, so a change needs a rebuild.
 */
const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

export const env = {
  /** e.g. https://tkclub-admn-api-qa.dvconsulting.org — no trailing slash. */
  apiBaseUrl: (apiBaseUrl ?? '').replace(/\/+$/, ''),
  /** Value the API expects in `x-talking-club-version`. */
  appVersion: '1.0.0',
  /** Language for API messages. The design is Korean. */
  apiLanguage: 'ko',
} as const;

export function requireApiBaseUrl(): string {
  if (!env.apiBaseUrl) {
    throw new Error('NEXT_PUBLIC_API_BASE_URL is not set. Copy .env.example to .env.local.');
  }
  return env.apiBaseUrl;
}

/** Headers every Talking Club API call needs (marked required in Swagger). */
export function talkingClubHeaders(): Record<string, string> {
  return {
    'accept-language': env.apiLanguage,
    'x-talking-club-platform': 'web',
    'x-talking-club-version': env.appVersion,
  };
}

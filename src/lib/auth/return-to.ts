import { ROUTES } from '@/config/app-routes';

/**
 * Where to go after login. Only same-site relative paths are accepted, so a crafted
 * link like /login?returnTo=https://evil.example cannot send the user elsewhere.
 */
export function safeReturnTo(value: string | null | undefined): string {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.startsWith('/\\')) return ROUTES.home;
  if (value.startsWith(ROUTES.login)) return ROUTES.home;
  return value;
}

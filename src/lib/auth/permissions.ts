import { PERMISSIONS, PROTECTED_ROUTES, findRoute, type AppRoute, type PermissionKey } from '@/config/app-routes';
import type { AuthUser, PermissionEntry } from '@/types/auth';

/** SUPER_ADMIN is allowed everything (the API returns it with an empty permission list). */
const ALL_ACCESS_ROLES = new Set(['SUPER_ADMIN']);

function entryGrants(entry: PermissionEntry, module: string, subModule: string): boolean {
  if (typeof entry === 'string') return entry === subModule || entry === `${module}.${subModule}`;
  return entry.module === module && entry.subModules.includes(subModule);
}

/** Can this user use the feature behind `key`? */
export function hasPermission(user: AuthUser | null, key: PermissionKey): boolean {
  if (!user) return false;
  if (ALL_ACCESS_ROLES.has(user.role)) return true;
  const { module, subModule } = PERMISSIONS[key];
  return (user.permissions ?? []).some((entry) => entryGrants(entry, module, subModule));
}

/**
 * Can this user open `pathname`?
 * A protected URL that is not in the config is refused, so a page added
 * without a config entry is never silently open.
 */
export function canOpenPath(user: AuthUser | null, pathname: string): boolean {
  const route = findRoute(pathname);
  return route ? hasPermission(user, route.permission) : false;
}

/** Routes this user may see in the menu. */
export function allowedRoutes(user: AuthUser | null): AppRoute[] {
  return PROTECTED_ROUTES.filter((r) => hasPermission(user, r.permission));
}

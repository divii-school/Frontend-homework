/** Roles the admin API returns on `user.role`. SUPER_ADMIN may use every screen. */
export type AdminRole = 'SUPER_ADMIN' | 'ADMIN' | string;

/**
 * One permission entry. The API writes permissions as `{ module, subModules[] }`
 * (POST /permissions/add) and the permission catalogue uses keys such as
 * `shopping_mall` → `product_management`, `category_management`.
 * Older payloads may send plain key strings, so both shapes are accepted.
 */
export type PermissionEntry = string | { module: string; subModules: string[] };

export interface LoginRequest {
  loginId: string;
  password: string;
}

/** `data.user` from POST /auth/login. Only the fields this app reads are typed. */
export interface AuthUser {
  id: number;
  uuid: string;
  fullName: string;
  userId: string;
  role: AdminRole;
  permissions: PermissionEntry[];
}

export interface LoginResponseData {
  token: string;
  user: AuthUser;
}

export interface RefreshResponseData {
  token: string;
}

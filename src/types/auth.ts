// Login / session types — POST /auth/login on talking-club-backend (release/qa).

export const ROLES = [
  "SUPER_ADMIN",
  "MASTER_ADMIN",
  "GENERAL_ADMIN",
  "REGIONAL_MANAGER",
  "PRINCIPAL",
  "TEACHER",
  "STUDENT",
  "GUARDIAN",
] as const;

export type Role = (typeof ROLES)[number];

export function isRole(value: unknown): value is Role {
  return typeof value === "string" && (ROLES as readonly string[]).includes(value);
}

/**
 * Per sub-module flags (권한 관리 A-6). Not sent by release/qa yet; when a row has no `actions`,
 * every action is allowed — same rule as the real admin frontend (src/utils/permissions.ts).
 */
export interface PermissionActionFlags {
  view?: boolean;
  register?: boolean;
  edit?: boolean;
}

/** `permissions` row: `{ module: 'shopping_mall', subModules: ['product_management', …] }`. */
export interface PermissionRow {
  module: string;
  subModules: string[];
  actions?: Record<string, PermissionActionFlags> | null;
}

/** `data.user` of the login response (only the fields this app uses are typed). */
export interface AuthUser {
  id: number;
  uuid: string;
  fullName: string;
  email: string | null;
  /** Kept as string: an unknown role from the API must not crash the app — it simply has no access. */
  role: string;
  userId: string;
  avatar?: string | null;
  permissions: PermissionRow[];
}

export interface LoginRequest {
  loginId: string;
  password: string;
}

export interface LoginResponseData {
  token: string;
  user: AuthUser;
}

/** What we keep in the browser after a successful login. */
export interface Session {
  token: string;
  user: AuthUser;
  /** "Auto login" was ticked → localStorage + persistent cookie; otherwise sessionStorage + session cookie. */
  remember: boolean;
}

/** JWT payload signed by the backend: `{ sub, email, role, iat, exp }`. */
export interface JwtPayload {
  sub?: number;
  email?: string;
  role?: string;
  iat?: number;
  exp?: number;
}

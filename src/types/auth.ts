/** Roles the API returns in `user.role`. Only SUPER_ADMIN has every permission without a grant. */
export type UserRole = "SUPER_ADMIN" | "ADMIN" | "REGIONAL_MANAGER" | "PRINCIPAL" | "TEACHER" | (string & {});

/** A permission grant as stored by POST /permissions/add: a module key and its sub-module keys. */
export interface PermissionGrant {
  module: string;
  subModules: string[];
}

export interface AuthUser {
  id: number;
  uuid: string;
  fullName: string;
  userId: string;
  role: UserRole;
  /** The API sends grants as objects; older accounts send plain keys. Both are accepted (see utils/permissions.ts). */
  permissions: Array<PermissionGrant | string>;
}

export interface LoginRequest {
  loginId: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: AuthUser;
}

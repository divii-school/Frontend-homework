/**
 * Roles the API returns in `user.role`: SUPER_ADMIN (the QA account), and the admin roles of the API document,
 * MASTER_ADMIN and GENERAL_ADMIN. Only SUPER_ADMIN has every permission without a grant; the others need it.
 */
export type UserRole = "SUPER_ADMIN" | "MASTER_ADMIN" | "GENERAL_ADMIN" | (string & {});

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

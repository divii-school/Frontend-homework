/** Admin roles. SUPER_ADMIN is confirmed on the QA server; GENERAL_ADMIN follows the Figma notes. */
export type Role = "SUPER_ADMIN" | "GENERAL_ADMIN";

/** The part of the login response's `user` that the app keeps. */
export interface SessionUser {
  id: number;
  fullName: string;
  /** Kept as a string: an unknown role from the API simply gets no pages. */
  role: string;
}

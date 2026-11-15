/** Cookie that holds the access token. A cookie (not localStorage) so middleware.ts can read it before a page renders. */
export const TOKEN_COOKIE = "tc_admin_token";
/** localStorage key for the signed-in user (name, role, permissions). Not a secret. */
export const USER_STORAGE_KEY = "tc_admin_user";
/** Query parameter that carries the page to return to after login. */
export const REDIRECT_PARAM = "redirect";
/** localStorage key for the chosen theme ("day" | "night"). Read by the pre-paint script in app/layout.tsx. */
export const THEME_STORAGE_KEY = "tc_admin_theme";
export const SUPER_ADMIN_ROLE = "SUPER_ADMIN";

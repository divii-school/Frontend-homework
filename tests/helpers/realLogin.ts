import { expect, test, type Page } from "@playwright/test";

/** True when .env.local has the QA test login (the real-API specs are skipped otherwise). */
export const hasQaLogin = Boolean(process.env.E2E_LOGIN_ID && process.env.E2E_PASSWORD && process.env.NEXT_PUBLIC_API_BASE_URL);

const apiBase = () => (process.env.NEXT_PUBLIC_API_BASE_URL ?? "").replace(/\/+$/, "");

/**
 * Real QA session without typing the login into the page: the HTML report and traces record typed
 * values, and that report is attached to the HW3 submission. The login form itself is covered by
 * the mocked specs (login.spec.ts, auth-roles.spec.ts).
 */
export async function realLogin(page: Page, next = "/shopping/products"): Promise<void> {
  test.skip(!hasQaLogin, "Set E2E_LOGIN_ID / E2E_PASSWORD in .env.local to run real-API specs");
  const response = await page.request.post(`${apiBase()}/api/v1/auth/login`, {
    headers: { "accept-language": "en", "x-talking-club-platform": "web" },
    data: { loginId: process.env.E2E_LOGIN_ID, password: process.env.E2E_PASSWORD },
  });
  expect(response.status(), "QA login").toBe(201);
  const { data } = (await response.json()) as { data: { token: string; user: { id: number; fullName: string | null; role: string } } };
  const session = JSON.stringify({ accessToken: data.token, user: { id: data.user.id, fullName: data.user.fullName ?? "", role: data.user.role } });
  await page.addInitScript((value) => sessionStorage.setItem("tc-admin-auth", value), session);
  await page.goto(next);
  await expect(page).toHaveURL(next);
}

/** Logs out through the header so the QA token is revoked at the end of the test. */
export async function realLogout(page: Page): Promise<void> {
  await page.getByRole("button", { name: "Log out" }).click();
  await expect(page).toHaveURL("/login");
}

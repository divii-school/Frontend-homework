import { expect, type Page } from "@playwright/test";

/** The QA login comes from .env.local. The tests stop with a clear message when it is missing. */
export function credentials(): { loginId: string; password: string } {
  const loginId = process.env.E2E_LOGIN_ID;
  const password = process.env.E2E_PASSWORD;
  if (!loginId || !password) {
    throw new Error("Set E2E_LOGIN_ID and E2E_PASSWORD in .env.local (the QA login from the DM). See .env.example.");
  }
  return { loginId, password };
}

export async function login(page: Page): Promise<void> {
  const { loginId, password } = credentials();
  await page.getByLabel("아이디").fill(loginId);
  await page.getByLabel("비밀번호", { exact: true }).fill(password);
  await page.getByRole("button", { name: "로그인" }).click();
}

/** Wait until the product table has rows (the first load of a page also compiles it in dev mode). */
export async function expectProductRows(page: Page): Promise<void> {
  await expect(page.getByRole("heading", { level: 1, name: "상품 관리" })).toBeVisible();
  await expect(page.locator(".p-datatable-tbody > tr").first()).toBeVisible();
}

/**
 * Pretend to be another user: the app reads the signed-in user (role, permissions) from localStorage,
 * so replacing it before the page loads shows what that user would see. The token stays the real one.
 */
export async function actAs(page: Page, role: string, permissions: string[]): Promise<void> {
  await page.addInitScript(
    ([userRole, grants]) => {
      const raw = window.localStorage.getItem("tc_admin_user");
      if (!raw) return;
      const user = JSON.parse(raw);
      window.localStorage.setItem("tc_admin_user", JSON.stringify({ ...user, role: userRole, permissions: grants }));
    },
    [role, permissions] as const,
  );
}

/** Fails the test when the browser console shows an error or a warning (the homework asks for zero). */
export function watchConsole(page: Page): string[] {
  const problems: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error" || message.type() === "warning") problems.push(`${message.type()}: ${message.text()}`);
  });
  page.on("pageerror", (error) => problems.push(`pageerror: ${error.message}`));
  return problems;
}

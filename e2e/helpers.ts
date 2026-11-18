import { expect, type BrowserContext, type Locator, type Page } from "@playwright/test";

// Shared Playwright helpers. Credentials come from .env.local (loaded by playwright.config.ts) and are
// never written into tests, reports or logs.

export const ADMIN_STORAGE_STATE = "e2e/.auth/admin.json";

/** Same keys as src/utils/session.ts. */
export const SESSION_STORAGE_KEY = "tc_hw3_session";
export const SESSION_COOKIE_NAME = "tc_hw3_token";

export interface AdminCredentials {
  id: string;
  password: string;
}

/** Reads E2E_ADMIN_ID / E2E_ADMIN_PASSWORD or fails with a clear message. */
export function requireAdminCredentials(): AdminCredentials {
  const id = process.env.E2E_ADMIN_ID ?? "";
  const password = process.env.E2E_ADMIN_PASSWORD ?? "";
  if (!id || !password) {
    throw new Error(
      "E2E_ADMIN_ID and E2E_ADMIN_PASSWORD are not set. Put them in .env.local (the shared QA login comes by DM) — see README → Tests.",
    );
  }
  return { id, password };
}

/** Login form locators (labels are visually hidden but real <label>s). */
export function loginForm(page: Page) {
  return {
    id: page.getByLabel("아이디", { exact: true }),
    password: page.getByLabel("비밀번호", { exact: true }),
    remember: page.getByLabel("자동 로그인"),
    submit: page.getByRole("button", { name: "로그인", exact: true }),
  };
}

/**
 * Puts a value into an input without Playwright recording the text. `locator.fill(value)` writes the value
 * into the step title (Fill "<value>"), so the HTML report would contain the real QA login. This sets the
 * value with the native setter and fires input + change, which React / react-hook-form handle like typing.
 */
export async function setInputValueQuietly(field: Locator, value: string): Promise<void> {
  const accepted = await field.evaluate((element, text) => {
    const input = element as HTMLInputElement;
    const setValue = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
    input.focus();
    setValue?.call(input, text);
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
    return input.value === text;
  }, value);
  if (!accepted) throw new Error("The input did not take the value.");
}

/** Fills and submits the login form (values are set quietly, so the login never shows up in the report). */
export async function loginThroughUi(page: Page, { id, password }: AdminCredentials): Promise<void> {
  const form = loginForm(page);
  await expect(form.id).toBeVisible({ timeout: 60_000 });
  await setInputValueQuietly(form.id, id);
  await setInputValueQuietly(form.password, password);
  // The Login button is enabled only after the form has read both values, so this proves the form reacted.
  await expect(form.submit).toBeEnabled();
  await form.submit.click();
}

function base64Url(value: string): string {
  return Buffer.from(value).toString("base64").replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_");
}

/** An unsigned JWT the app can decode (role + exp). The API would reject it — tests mock the API. */
export function fakeJwt(role: string, expiresInSeconds = 3600): string {
  const header = base64Url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const now = Math.floor(Date.now() / 1000);
  const payload = base64Url(JSON.stringify({ sub: 999001, role, iat: now, exp: now + expiresInSeconds }));
  return `${header}.${payload}.e2e-signature`;
}

export interface FakeUserOptions {
  role: string;
  permissions?: Array<{ module: string; subModules: string[] }>;
  fullName?: string;
}

/** Puts a session (cookie for the middleware + localStorage for the app) into a fresh context. */
export async function injectSession(context: BrowserContext, baseURL: string, options: FakeUserOptions): Promise<void> {
  const token = fakeJwt(options.role);
  const user = {
    id: 999001,
    uuid: "hw3-e2e-user",
    fullName: options.fullName ?? `HW3 E2E ${options.role}`,
    email: null,
    role: options.role,
    userId: "hw3-e2e-user",
    permissions: options.permissions ?? [],
  };
  const url = new URL(baseURL);
  await context.addCookies([{ name: SESSION_COOKIE_NAME, value: token, domain: url.hostname, path: "/", sameSite: "Lax" }]);
  await context.addInitScript(
    ([key, value]) => {
      window.localStorage.setItem(key, value);
    },
    [SESSION_STORAGE_KEY, JSON.stringify({ token, user, remember: true })] as const,
  );
}

/**
 * The colour of a design token (`--color-<name>`, src/styles/_tokens.scss) as the browser resolves it for the
 * theme of the page, in the same "rgb(r, g, b)" form as getComputedStyle / toHaveCSS.
 */
export async function tokenColor(page: Page, name: string): Promise<string> {
  return page.evaluate((token) => {
    const probe = document.createElement("span");
    probe.style.color = `var(--color-${token})`;
    document.body.appendChild(probe);
    const color = getComputedStyle(probe).color;
    probe.remove();
    return color;
  }, name);
}

/** Answers every call to the API with an empty success envelope, so role tests never hit the QA server. */
export async function mockApi(page: Page): Promise<void> {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL;
  const pattern = base ? `${new URL(base).origin}/**` : "**/api/v1/**";
  await page.route(pattern, (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      headers: { "access-control-allow-origin": "*" },
      body: JSON.stringify({ success: true, message: "", data: [], totalRecords: 0, totalPage: 0, page: 1, isCreatable: true }),
    }),
  );
}

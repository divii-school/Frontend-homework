import { test, expect } from "@playwright/test";
import { sanitizeReturnTo } from "../src/utils/session";
import { loginForm, loginThroughUi, requireAdminCredentials } from "./helpers";

// Login, protected routes, returnTo and logout (design 1.1.0). Runs in the "guest" project:
// a fresh browser without a saved session. Tests marked "QA API" need the QA server + .env.local login.

test.describe("Login page (no API)", () => {
  test("shows the design fields; Login stays disabled until ID and password are filled", async ({ page }) => {
    await page.goto("/login");
    const form = loginForm(page);
    await expect(page.getByRole("heading", { name: "토킹클럽 관리자 로그인" })).toBeAttached();
    await expect(form.id).toBeVisible();
    await expect(form.password).toHaveAttribute("type", "password");
    await expect(form.remember).toBeChecked();
    await expect(form.submit).toBeDisabled();

    await form.id.fill("someone");
    await expect(form.submit).toBeDisabled();
    await form.password.fill("secret");
    await expect(form.submit).toBeEnabled();

    // An ID of only spaces does not count
    await form.id.fill("   ");
    await expect(form.submit).toBeDisabled();
  });

  test("the logo is the TalkingClub image, alone as in frame 1.1.0; the page heading stays for screen readers", async ({ page }) => {
    await page.goto("/login");
    const logo = page.getByRole("img", { name: "TalkingClub" });
    await expect(logo).toBeVisible();
    // The mark and the wordmark both come from the logo file (not text, not a drawn copy)
    await expect(logo.locator("image").first()).toHaveAttribute("href", "/brand/talkingclub-logo.png");
    const file = await page.evaluate(async (src) => {
      const image = new Image();
      image.src = src;
      await image.decode();
      return { width: image.naturalWidth, height: image.naturalHeight };
    }, "/brand/talkingclub-logo.png");
    expect(file).toEqual({ width: 512, height: 107 });
    const box = await logo.boundingBox();
    expect(Math.round(box?.width ?? 0)).toBe(158); // Figma: 158 x 30
    expect(Math.round(box?.height ?? 0)).toBe(30);

    // No visible text beside the logo ("관리자" was removed); the name of the page is still there for screen readers
    await expect(page.locator(".login-brand")).toHaveText("");
    await expect(page.getByRole("heading", { name: "토킹클럽 관리자 로그인" })).toBeAttached();
    await expect(page).toHaveTitle(/토킹클럽 관리자$/);
  });

  test("touched empty fields show validation messages", async ({ page }) => {
    await page.goto("/login");
    const form = loginForm(page);
    await form.id.click();
    await form.password.click();
    await expect(page.getByText("아이디를 입력해 주세요.")).toBeVisible();
    await expect(form.id).toHaveAttribute("aria-invalid", "true");

    await form.id.click();
    await expect(page.getByText("비밀번호를 입력해 주세요.")).toBeVisible();

    await form.id.fill("someone");
    await expect(page.getByText("아이디를 입력해 주세요.")).toHaveCount(0);
  });

  test("the eye button shows and hides the password", async ({ page }) => {
    await page.goto("/login");
    const form = loginForm(page);
    await form.password.fill("secret");
    await page.getByRole("button", { name: "비밀번호 표시" }).click();
    await expect(form.password).toHaveAttribute("type", "text");
    await page.getByRole("button", { name: "비밀번호 숨기기" }).click();
    await expect(form.password).toHaveAttribute("type", "password");
  });

  test("a protected route redirects to /login with returnTo (path + query)", async ({ page }) => {
    await page.goto("/shopping-mall/products?page=2");
    await expect(page).toHaveURL(/\/login\?returnTo=%2Fshopping-mall%2Fproducts%3Fpage%3D2$/);
    await expect(loginForm(page).id).toBeVisible();
  });

  test("returnTo only accepts same-site relative paths", () => {
    expect(sanitizeReturnTo("/shopping-mall/products?page=2")).toBe("/shopping-mall/products?page=2");
    expect(sanitizeReturnTo("//evil.example.com")).toBeNull();
    expect(sanitizeReturnTo("%2F%2Fevil.example.com")).toBeNull();
    expect(sanitizeReturnTo("https://evil.example.com")).toBeNull();
    expect(sanitizeReturnTo("/\\evil.example.com")).toBeNull();
    expect(sanitizeReturnTo("/login?returnTo=/x")).toBeNull();
    expect(sanitizeReturnTo("")).toBeNull();
  });
});

test.describe("Login with the QA API", () => {
  test.setTimeout(120_000);

  /**
   * The shared QA API sometimes needs more than the default 5 s for the first login answer of a run (seen on
   * 17 and 18 Nov: the 로그인 button was still busy; a probe right after measured up to 2.7 s per answer).
   * The check is the same; only the waiting time for the server is longer.
   */
  const QA_API_ANSWER_TIMEOUT = 15_000;

  test("an unknown ID shows the API message", async ({ page }) => {
    await page.goto("/login");
    await loginThroughUi(page, { id: "HW3-Neeraj-no-such-user", password: "not-a-real-password" });
    const dialog = page.getByRole("dialog");
    await expect(dialog).toContainText("등록되지 않은 계정입니다.", { timeout: QA_API_ANSWER_TIMEOUT });
    await dialog.getByRole("button", { name: "확인" }).click();
    await expect(page.getByText("등록된 아이디가 아닙니다")).toBeVisible();
  });

  test("a wrong password shows the API message", async ({ page }) => {
    const { id } = requireAdminCredentials();
    await page.goto("/login");
    await loginThroughUi(page, { id, password: "HW3-Neeraj-wrong-password" });
    const dialog = page.getByRole("dialog");
    await expect(dialog).toContainText("아이디와 비밀번호가 일치하지 않습니다", { timeout: QA_API_ANSWER_TIMEOUT });
    await dialog.getByRole("button", { name: "확인" }).click();
    await expect(page.getByText("비밀번호가 일치하지 않습니다")).toBeVisible();
    await expect(loginForm(page).password).toBeFocused();
  });

  test("after login the user comes back to the protected URL (returnTo)", async ({ page }) => {
    const credentials = requireAdminCredentials();
    await page.goto("/shopping-mall/products?page=2");
    await expect(page).toHaveURL(/\/login\?returnTo=/);
    await loginThroughUi(page, credentials);
    await expect(page).toHaveURL(/\/shopping-mall\/products\?page=2$/, { timeout: 60_000 });
    await expect(page.getByRole("heading", { name: "상품 관리", level: 1 })).toBeVisible();
  });

  test("logout clears the session and protects routes again", async ({ page }) => {
    const credentials = requireAdminCredentials();
    await page.goto("/login");
    await loginThroughUi(page, credentials);
    await expect(page).toHaveURL(/\/shopping-mall\//, { timeout: 60_000 });

    await page.getByRole("button", { name: "로그아웃" }).click();
    await expect(page).toHaveURL(/\/login$/);

    await page.goto("/shopping-mall/products");
    await expect(page).toHaveURL(/\/login\?returnTo=%2Fshopping-mall%2Fproducts$/);
  });
});

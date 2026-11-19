import { test, expect } from "@playwright/test";
import { injectSession, SESSION_COOKIE_NAME } from "./helpers";

// Mid-session 401 (design 1.1.0, part A) with a MOCKED API — passes while the QA server is down.
// A fake SUPER_ADMIN session is injected, every API call answers 401, and the app must clear the
// session and send the user to /login?returnTo=<page they were on, path + query>.
//
// Run alone (no QA login needed):  npx playwright test e2e/session-expiry-states.spec.ts --project=mocked

test.use({ storageState: { cookies: [], origins: [] } });

const PAGE_URL = "/shopping-mall/products?page=2";

test.describe("Session expiry (mocked API)", () => {
  test("an API 401 clears the session and goes to /login?returnTo=<current page>", async ({ page, context, baseURL }) => {
    await injectSession(context, baseURL ?? "http://localhost:3000", { role: "SUPER_ADMIN" });

    const base = process.env.NEXT_PUBLIC_API_BASE_URL;
    const pattern = base ? `${new URL(base).origin}/**` : "**/api/v1/**";
    let unauthorizedCalls = 0;
    await page.route(pattern, (route) => {
      unauthorizedCalls += 1;
      return route.fulfill({
        status: 401,
        contentType: "application/json",
        headers: { "access-control-allow-origin": "*" },
        body: JSON.stringify({ success: false, message: "Unauthorized", data: null, errors: null, statusCode: 401 }),
      });
    });

    await page.goto(PAGE_URL);

    await expect(page).toHaveURL(/\/login\?returnTo=%2Fshopping-mall%2Fproducts%3Fpage%3D2$/);
    expect(unauthorizedCalls, "the app really called the API and got the 401").toBeGreaterThan(0);
    const cookies = await context.cookies();
    expect(cookies.find((cookie) => cookie.name === SESSION_COOKIE_NAME), "session cookie is cleared").toBeUndefined();
  });
});

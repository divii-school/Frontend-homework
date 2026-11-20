import type { Page } from "@playwright/test";

/** Puts a fake logged-in session in sessionStorage before the app loads (the API itself is mocked per test). */
export async function fakeSession(page: Page, role = "SUPER_ADMIN", fullName = "HW3 Tester"): Promise<void> {
  await page.addInitScript(
    ({ role, fullName }) => {
      sessionStorage.setItem("tc-admin-auth", JSON.stringify({ accessToken: "test-token", user: { id: 1, fullName, role } }));
    },
    { role, fullName },
  );
}

export function envelope(data: unknown, statusCode = 200, message = statusCode < 400 ? "Success" : "Something went wrong") {
  return JSON.stringify({ success: statusCode < 400, message, data, errors: null, statusCode });
}

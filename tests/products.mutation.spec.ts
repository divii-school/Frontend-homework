import { test, expect, type APIRequestContext, type Page } from "@playwright/test";
import { realLogin, realLogout, hasQaLogin } from "./helpers/realLogin";
import { pngFile } from "./helpers/images";

// MUTATION spec against the shared QA server (run only with `npm run test:e2e:mutation`).
// HW3 rule: only our own records, named HW3-Sandip-…, and removed after the test.

const API = () => (process.env.NEXT_PUBLIC_API_BASE_URL ?? "").replace(/\/+$/, "");
const PREFIX = "HW3-Sandip-E2E-";
const stamp = Date.now();
const NAME = `${PREFIX}${stamp}`;
const EDITED = `${NAME}-edited`;

test.describe.configure({ mode: "serial" });

async function apiToken(request: APIRequestContext): Promise<string> {
  const res = await request.post(`${API()}/api/v1/auth/login`, {
    headers: { "accept-language": "en", "x-talking-club-platform": "web" },
    data: { loginId: process.env.E2E_LOGIN_ID, password: process.env.E2E_PASSWORD },
  });
  return ((await res.json()) as { data: { token: string } }).data.token;
}

/** Safety net: delete every leftover HW3-Sandip-E2E-* product, even if a test failed midway. */
test.afterAll(async ({ request }) => {
  if (!hasQaLogin) return;
  const token = await apiToken(request);
  const headers = { Authorization: `Bearer ${token}`, "accept-language": "en", "x-talking-club-platform": "web" };
  const res = await request.get(`${API()}/api/v1/products`, { headers, params: { page: 1, limit: 50, type: "productName", search: PREFIX } });
  const rows = ((await res.json()) as { data: { id: number; productName: string }[] }).data ?? [];
  const ids = rows.filter((r) => r.productName.startsWith(PREFIX)).map((r) => r.id);
  if (ids.length) await request.delete(`${API()}/api/v1/products/delete`, { headers, data: { ids } });
  await request.get(`${API()}/api/v1/auth/logout`, { headers });
});

async function searchList(page: Page, term: string) {
  await page.goto(`/shopping/products?search=${encodeURIComponent(term)}`);
  return page.getByRole("table").locator("tbody tr");
}

test("register → edit → exposure status → delete one HW3-Sandip product", async ({ page }) => {
  test.setTimeout(180_000);
  await realLogin(page, "/shopping/products/new");

  // Step 1
  await expect(page.getByLabel("상품 코드")).toHaveValue(/^PRD-\d+$/);
  await page.getByLabel("상품명").fill(NAME);
  await page.getByLabel("단가").fill("1000");
  await page.getByLabel("판매가").fill("1500");
  await page.getByLabel("상세 설명").fill("Created by the HW3 Playwright mutation test; deleted at the end.");
  await page.getByRole("button", { name: "다음", exact: true }).click();

  // Step 2 — real upload: API signed URL → /api/upload → S3
  await page.locator('input[type="file"]').setInputFiles(pngFile(`${NAME}.png`));
  await expect(page.getByRole("img", { name: "상품 이미지 1" })).toBeVisible({ timeout: 30_000 });
  await page.getByRole("button", { name: "다음", exact: true }).click();

  // Step 3 — first category at each level
  await page.getByRole("radio").first().check();
  await page.locator("fieldset").nth(1).getByRole("radio").first().check();
  await page.locator("fieldset").nth(2).getByRole("radio").first().check();
  await page.getByRole("button", { name: "다음", exact: true }).click();

  // Step 4
  await expect(page.getByLabel("ERP 코드")).toHaveValue("등록 후 자동으로 부여됩니다");
  await page.getByLabel("ERP 상품명").fill("HW3 Sandip ERP");
  await page.getByLabel("수량").fill("1");
  await page.getByLabel("면세 여부").selectOption("tax");
  await page.getByLabel("ERP 단가").fill("800");
  await page.getByRole("button", { name: "등록" }).click();
  await expect(page).toHaveURL("/shopping/products", { timeout: 20_000 });

  // In the list
  let rows = await searchList(page, NAME);
  await expect(rows).toHaveCount(1);
  await expect(rows.first()).toContainText("₩1,500");

  // Edit
  await rows.first().getByRole("link", { name: NAME }).click();
  await page.waitForURL(/\/shopping\/products\/\d+/);
  const id = Number(page.url().match(/products\/(\d+)/)?.[1]);
  await page.goto(`/shopping/products/${id}/edit`);
  await expect(page.getByLabel("상품명")).toHaveValue(NAME);
  await page.getByLabel("상품명").fill(EDITED);
  await page.getByLabel("판매가").fill("2000");
  for (let i = 0; i < 3; i++) await page.getByRole("button", { name: "다음", exact: true }).click();
  // The server assigned an ERP code on registration; it shows read-only here.
  await expect(page.getByLabel("ERP 코드")).not.toHaveValue(/^(-|)$/);
  await page.getByRole("button", { name: "저장" }).click();
  await expect(page).toHaveURL("/shopping/products", { timeout: 20_000 });

  rows = await searchList(page, EDITED);
  await expect(rows).toHaveCount(1);
  await expect(rows.first()).toContainText("₩2,000");
  // Editing must keep image keys (no doubled "…amazonaws.com/https://…" URL after save).
  const thumb = decodeURIComponent((await rows.first().locator("img").getAttribute("src")) ?? "");
  expect(thumb).toContain("/products/");
  expect(thumb).not.toMatch(/amazonaws\.com\/https?:/);

  // Exposure status (confirms the update-status value) — survives a reload
  const status = page.getByLabel(`${EDITED} 노출 여부`);
  const before = await status.inputValue();
  const target = before === "yes" ? "no" : "yes";
  await status.selectOption(target);
  await expect(page.getByText(`“${EDITED}” 노출 여부를 ${target === "yes" ? "노출" : "미노출"}로 변경했습니다.`)).toBeVisible();
  await page.reload();
  await expect(page.getByLabel(`${EDITED} 노출 여부`)).toHaveValue(target);

  // Delete through the list
  await page.getByLabel(`${EDITED} 선택`).check();
  await page.getByRole("button", { name: "삭제", exact: true }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "삭제" }).click();
  await expect(page.getByText("상품 1개를 삭제했습니다.")).toBeVisible();
  await expect(page.getByRole("table").locator("tbody")).toContainText("검색 결과가 없습니다.");

  await realLogout(page);
});

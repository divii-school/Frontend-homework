// Design | build screenshots for the HW3 submission (training Step 8 / submission page section 8).
//
//   node scripts/screenshots/compare.mjs            (app must already run on BASE, default http://localhost:3000)
//   BASE=http://localhost:3001 node scripts/screenshots/compare.mjs
//
// What it does:
//  - starts NOTHING itself: it expects `npm run dev` (or `npx next start`) to be running already
//  - never calls the real API: every request that does not go to BASE is answered from
//    scripts/screenshots/fixtures.mjs (the API) or a fake CDN (book-cover SVGs); anything else is aborted
//  - main screens get an injected SUPER_ADMIN session (unsigned JWT + user in localStorage, same keys as
//    e2e/helpers.ts injectSession); the login screen opens with no session
//  - captures login, product list, product form step 1, product details and categories at
//    1440 / 768 / 375 px, light and dark (full page)
//  - writes into docs/screenshots/:
//      compare-1440-<screen>.png   design PNG (docs/design/) | build light | build dark, side by side
//      build-<768|375>-<light|dark>-<screen>.png   single build shots
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";
import {
  CDN_ORIGIN,
  DETAILS_ID,
  categoryTree,
  coverSvg,
  pickerCategories,
  pickerChildCategories,
  pickerSubCategories,
  productDetails,
  productPage,
} from "./fixtures.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const BASE = (process.env.BASE || "http://localhost:3000").replace(/\/+$/, "");
const BASE_ORIGIN = new URL(BASE).origin;
const DESIGN_DIR = path.join(ROOT, "docs", "design");
const OUT_DIR = path.join(ROOT, "docs", "screenshots");

// Same keys as src/utils/session.ts and src/utils/theme.ts
const SESSION_STORAGE_KEY = "tc_hw3_session";
const SESSION_COOKIE_NAME = "tc_hw3_token";
const THEME_STORAGE_KEY = "tc-hw3-theme";

const WIDTHS = [
  { width: 1440, height: 900 },
  { width: 768, height: 1024 },
  { width: 375, height: 812 },
];
const THEMES = ["light", "dark"];

/** Hides the Next.js dev-mode indicator in the shots (it is not part of the app). */
const SHOT_STYLE = "nextjs-portal { display: none !important; }";

// ---- The five screens -------------------------------------------------------------------------------
const SCREENS = [
  {
    key: "login",
    label: "1.1.0 Login",
    url: "/login",
    session: false,
    design: "1.1.0-login.png",
    ready: async (page, theme) => {
      await page.getByLabel("ID", { exact: true }).waitFor({ state: "visible" });
      // The ID field is already in the server HTML, so also wait until the page is hydrated:
      // PrimeReact has hidden the native "Auto login" checkbox (1 px wrapper) and the theme toggle
      // shows the icon of the applied theme. Otherwise the shot can show two checkboxes or the wrong icon.
      await page.waitForFunction(() => {
        const input = document.querySelector("#login-remember");
        return !!input && input.getBoundingClientRect().width <= 1;
      });
      await page
        .getByRole("button", { name: theme === "dark" ? "Switch to light mode" : "Switch to dark mode" })
        .waitFor({ state: "visible" });
    },
  },
  {
    key: "product-list",
    label: "8.1.0 Product list",
    url: "/shopping-mall/products",
    session: true,
    design: "8.1.0-product-list.png",
    ready: async (page) => {
      await page.locator(".product-table tbody tr").nth(9).waitFor({ state: "visible" });
    },
  },
  {
    key: "product-form",
    label: "8.1.1 Product registration — step 1 of 4",
    url: "/shopping-mall/products/create",
    session: true,
    design: "8.1.1-product-registration.png",
    ready: async (page) => {
      await page.waitForFunction(() => {
        const code = document.querySelector("#product-code");
        return code instanceof HTMLInputElement && code.value.length > 0;
      });
    },
  },
  {
    key: "product-details",
    label: "Product details (Overview tab)",
    url: `/shopping-mall/products/details/${DETAILS_ID}`,
    session: true,
    design: "8.1.2-product-edit.png",
    designNote:
      "There is no product-details frame in Figma (design question 4). Shown for reference: 8.1.2 Product edit, the closest frame.",
    ready: async (page) => {
      await page.getByRole("heading", { name: "Basic information" }).waitFor({ state: "visible" });
    },
  },
  {
    key: "categories",
    label: "8.2.0 Product category management",
    url: "/shopping-mall/categories",
    session: true,
    design: "8.2.0-category-management.png",
    ready: async (page) => {
      await page.locator('li[data-level="childCategory"][data-id="536"]').waitFor({ state: "visible" });
    },
  },
];

// ---- Session --------------------------------------------------------------------------------------
function base64Url(value) {
  return Buffer.from(value).toString("base64").replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_");
}

/** Unsigned JWT the app can decode (role + exp). Only the mocked API ever sees it. */
function fakeJwt(role) {
  const now = Math.floor(Date.now() / 1000);
  const header = base64Url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = base64Url(JSON.stringify({ sub: 990001, role, iat: now, exp: now + 3600 }));
  return `${header}.${payload}.screenshot-signature`;
}

async function injectSession(context) {
  const token = fakeJwt("SUPER_ADMIN");
  const user = {
    id: 990001,
    uuid: "hw3-screenshots",
    fullName: "홍길동",
    email: null,
    role: "SUPER_ADMIN",
    userId: "hw3-screenshots",
    permissions: [],
  };
  await context.addCookies([
    { name: SESSION_COOKIE_NAME, value: token, domain: new URL(BASE).hostname, path: "/", sameSite: "Lax" },
  ]);
  await context.addInitScript(
    ([key, value]) => {
      try {
        window.localStorage.setItem(key, value);
      } catch {
        // storage blocked: the app will redirect to login and the ready() check fails loudly
      }
    },
    [SESSION_STORAGE_KEY, JSON.stringify({ token, user, remember: true })],
  );
}

// ---- Mocked network -------------------------------------------------------------------------------
const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET,POST,PUT,DELETE,OPTIONS",
  "access-control-allow-headers": "authorization,content-type,accept-language,x-talking-club-platform,x-talking-club-version",
};

function json(route, body, status = 200) {
  return route.fulfill({ status, contentType: "application/json", headers: CORS, body: JSON.stringify(body) });
}

const ok = (data, extra = {}) => ({ success: true, message: "", data, ...extra });

/** Answers the API from fixtures.mjs. `apiPath` is the path after /api/v1. */
function answerApi(route, url, apiPath) {
  let match;
  if (apiPath === "/products/get-products-by-category" || apiPath === "/products") {
    return json(route, productPage(url.searchParams));
  }
  if ((match = /^\/products\/details\/(\d+)$/.exec(apiPath))) return json(route, ok(productDetails(Number(match[1]))));
  if (apiPath === "/products/generate-code") return json(route, ok("PRD-001129"));
  if (apiPath === "/products/categories") return json(route, ok(pickerCategories()));
  if ((match = /^\/products\/subcategories\/(\d+)$/.exec(apiPath))) return json(route, ok(pickerSubCategories(Number(match[1]))));
  if ((match = /^\/products\/childcategories\/(\d+)$/.exec(apiPath))) return json(route, ok(pickerChildCategories(Number(match[1]))));
  if (apiPath === "/product-category/list") {
    // QA already has 3 main categories → isCreatable false (the "limit of 3" reason shows under the button)
    const tree = categoryTree();
    return json(route, ok(tree, { totalRecords: tree.length, isCreatable: false }));
  }
  return json(route, ok([], { totalRecords: 0, totalPage: 0, page: 1 }));
}

/** Everything that does not go to the app itself: mocked API, fake CDN, or aborted. */
async function mockNetwork(context) {
  await context.route(
    (url) => url.origin !== BASE_ORIGIN,
    (route) => {
      const request = route.request();
      const url = new URL(request.url());
      if (request.method() === "OPTIONS") return route.fulfill({ status: 204, headers: CORS });
      if (url.origin === CDN_ORIGIN) {
        const id = Number(/cover-(\d+)\.svg$/.exec(url.pathname)?.[1] ?? "1");
        return route.fulfill({ status: 200, contentType: "image/svg+xml", headers: CORS, body: coverSvg(id) });
      }
      const apiIndex = url.pathname.indexOf("/api/v1/");
      if (apiIndex >= 0) return answerApi(route, url, url.pathname.slice(apiIndex + "/api/v1".length).replace(/\/+$/, ""));
      return route.abort("blockedbyclient");
    },
  );
}

// ---- Capture --------------------------------------------------------------------------------------
/** Scrolls once through the page so lazy images load, then waits for every image. */
async function settle(page) {
  await page.evaluate(async () => {
    const step = Math.max(window.innerHeight - 100, 200);
    for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((resolve) => setTimeout(resolve, 80));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForFunction(() => Array.from(document.images).every((image) => image.complete), null, { timeout: 15_000 });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(400);
}

async function capture(browser, screen, viewport, theme) {
  const context = await browser.newContext({ viewport, deviceScaleFactor: 1, colorScheme: theme, locale: "en-US" });
  await context.addInitScript(
    ([key, value]) => {
      try {
        window.localStorage.setItem(key, value);
      } catch {
        // ignore
      }
    },
    [THEME_STORAGE_KEY, theme],
  );
  if (screen.session) await injectSession(context);
  await mockNetwork(context);

  const page = await context.newPage();
  page.setDefaultTimeout(90_000);
  const problems = [];
  page.on("pageerror", (error) => problems.push(error.message));
  try {
    await page.goto(`${BASE}${screen.url}`, { waitUntil: "domcontentloaded", timeout: 120_000 });
    await screen.ready(page, theme);
    const appliedTheme = await page.evaluate(() => document.documentElement.getAttribute("data-theme"));
    if (appliedTheme !== theme) throw new Error(`theme is "${appliedTheme}", expected "${theme}"`);
    await settle(page);
    const buffer = await page.screenshot({ fullPage: true, animations: "disabled", caret: "hide", style: SHOT_STYLE });
    if (problems.length > 0) console.warn(`  ! page errors on ${screen.key} ${viewport.width} ${theme}: ${problems.join(" | ")}`);
    return buffer;
  } finally {
    await context.close();
  }
}

// ---- Side-by-side composition ----------------------------------------------------------------------
const COLUMN = 760;

function escapeHtml(text) {
  return text.replace(/[<>&"]/g, (char) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;" })[char]);
}

async function compose(browser, screen, design, light, dark) {
  const toSrc = (buffer) => `data:image/png;base64,${buffer.toString("base64")}`;
  const column = (title, note, buffer) => `
    <figure>
      <figcaption><strong>${escapeHtml(title)}</strong>${note ? `<span>${escapeHtml(note)}</span>` : ""}</figcaption>
      <img src="${toSrc(buffer)}" alt="">
    </figure>`;
  const html = `<!doctype html><html><head><meta charset="utf-8"><style>
    * { box-sizing: border-box; }
    body { margin: 0; padding: 24px; background: #e9ebef; font: 14px/1.4 "Segoe UI", Arial, sans-serif; color: #1f2329; }
    h1 { margin: 0 0 16px; font-size: 20px; }
    .row { display: flex; gap: 24px; align-items: flex-start; }
    figure { margin: 0; width: ${COLUMN}px; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,.15); }
    figcaption { padding: 10px 14px; border-bottom: 1px solid #d9dce1; display: flex; flex-direction: column; gap: 2px; }
    figcaption span { color: #5b6270; font-size: 12px; }
    img { display: block; width: 100%; height: auto; }
  </style></head><body>
    <h1>${escapeHtml(screen.label)} — design | build at 1440 px</h1>
    <div class="row">
      ${column(`Design — docs/design/${screen.design}`, screen.designNote ?? "Figma export", design)}
      ${column("Build — 1440 px, light", "Chromium, mocked API (scripts/screenshots/fixtures.mjs)", light)}
      ${column("Build — 1440 px, dark", "Dark mode is not in Figma (design question 2)", dark)}
    </div>
  </body></html>`;

  const context = await browser.newContext({ viewport: { width: COLUMN * 3 + 24 * 4, height: 800 }, deviceScaleFactor: 1 });
  try {
    const page = await context.newPage();
    await page.setContent(html, { waitUntil: "load" });
    await page.waitForFunction(() => Array.from(document.images).every((image) => image.complete && image.naturalWidth > 0));
    return await page.screenshot({ fullPage: true });
  } finally {
    await context.close();
  }
}

// ---- Main -----------------------------------------------------------------------------------------
async function main() {
  // Fail fast with a clear message when the app is not running
  try {
    const response = await fetch(`${BASE}/login`, { redirect: "manual" });
    if (response.status >= 500) throw new Error(`HTTP ${response.status}`);
  } catch (error) {
    console.error(`The app is not reachable at ${BASE} (${error.message}). Start it first: npm run dev`);
    process.exit(1);
  }

  await mkdir(OUT_DIR, { recursive: true });
  const browser = await chromium.launch();
  const written = [];
  try {
    for (const screen of SCREENS) {
      const shots = {};
      for (const viewport of WIDTHS) {
        for (const theme of THEMES) {
          process.stdout.write(`- ${screen.key} ${viewport.width} ${theme} … `);
          shots[`${viewport.width}-${theme}`] = await capture(browser, screen, viewport, theme);
          console.log("ok");
          if (viewport.width !== 1440) {
            const file = path.join(OUT_DIR, `build-${viewport.width}-${theme}-${screen.key}.png`);
            await writeFile(file, shots[`${viewport.width}-${theme}`]);
            written.push(file);
          }
        }
      }
      const design = await readFile(path.join(DESIGN_DIR, screen.design));
      const composite = await compose(browser, screen, design, shots["1440-light"], shots["1440-dark"]);
      const file = path.join(OUT_DIR, `compare-1440-${screen.key}.png`);
      await writeFile(file, composite);
      written.push(file);
    }
  } finally {
    await browser.close();
  }
  console.log(`\n${written.length} files written to ${path.relative(ROOT, OUT_DIR)}`);
  written.forEach((file) => console.log(`  ${path.relative(ROOT, file)}`));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

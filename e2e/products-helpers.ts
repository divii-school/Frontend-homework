import { expect, type Page, type Route } from "@playwright/test";
import type { Product, ProductDetails } from "../src/api-services/ProductService.types";

// Helpers for the product list / details specs only (products-*.spec.ts).
//  - watchConsole(): every product spec fails on console errors / warnings and page errors.
//  - mockProductApi(): answers the product endpoints from test data, so products-states.spec.ts
//    runs while the QA API is down. Never touches the real QA server.

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";
export const API_ORIGIN = API_BASE_URL ? new URL(API_BASE_URL).origin : "";
const API_PATTERN = API_ORIGIN ? `${API_ORIGIN}/**` : "**/api/v1/**";
const IMAGE_URL = /\.(png|jpe?g|gif|webp|svg|avif)(\?|$)/i;

export const LIST_URL = "/shopping-mall/products";

interface ConsoleOptions {
  /** States spec: the browser logs "Failed to load resource" for the 403 / 500 / aborted calls it fakes on purpose. */
  allowFailedApiCalls?: boolean;
}

/** Starts collecting console errors / warnings; call the returned function at the end of the test. */
export function watchConsole(page: Page, options: ConsoleOptions = {}): () => void {
  const problems: string[] = [];
  page.on("console", (message) => {
    if (message.type() !== "error" && message.type() !== "warning") return;
    const text = message.text();
    const url = message.location().url ?? "";
    if (/Failed to load resource/.test(text)) {
      // A broken product image is data, not an app error: the UI shows the grey placeholder
      if (IMAGE_URL.test(url)) return;
      if (options.allowFailedApiCalls && API_ORIGIN && url.startsWith(API_ORIGIN)) return;
    }
    problems.push(`[${message.type()}] ${text}${url ? ` (${url})` : ""}`);
  });
  page.on("pageerror", (error) => problems.push(`[pageerror] ${error.message}`));
  return () => expect(problems, "console errors / warnings / page errors").toEqual([]);
}

/** "Total: 1,234" → 1234. */
export async function readTotal(page: Page): Promise<number> {
  const text = (await page.locator(".product-list-total strong").textContent()) ?? "";
  return Number(text.replace(/[^\d]/g, "") || "0");
}

// ---- Mock data ----------------------------------------------------------------------------------
export function mockProduct(id: number, overrides: Partial<Product> = {}): Product {
  return {
    id,
    uuid: `mock-${id}`,
    productName: `HW3-Mock-Product-${id}`,
    productCode: `PRD-${String(id).padStart(6, "0")}`,
    price: 5000 + id * 100,
    unitPrice: 4000 + id * 100,
    description: "Mock product for the states spec.",
    images: [],
    image: null,
    isVisible: true,
    onSale: true,
    isOptions: false,
    erpCode: `E${id}`,
    erpName: `ERP ${id}`,
    erpUnitPrice: 3000,
    quantity: 1,
    taxType: "tax",
    category: { id: 1, name: "Main books" },
    subCategory: { id: 11, name: "Phonics" },
    childCategory: { id: 111, name: "Insider" },
    createdBy: null,
    isSuspended: false,
    isDeleted: false,
    createdAt: new Date(Date.UTC(2025, 8, 12, 8, id % 60)).toISOString(),
    updatedAt: new Date(Date.UTC(2025, 8, 12, 9, 0)).toISOString(),
    ...overrides,
  };
}

export function mockDetails(id: number, overrides: Partial<ProductDetails> = {}): ProductDetails {
  return { ...mockProduct(id), productOptions: [], ...overrides };
}

export function fulfillJson(route: Route, status: number, body: unknown): Promise<void> {
  return route.fulfill({
    status,
    contentType: "application/json",
    headers: { "access-control-allow-origin": "*" },
    body: JSON.stringify(body),
  });
}

/** Paged envelope like the real list endpoints (search = product name contains, like the API). */
export function fulfillProductPage(route: Route, url: URL, products: Product[]): Promise<void> {
  const page = Number(url.searchParams.get("page") ?? "1");
  const limit = Number(url.searchParams.get("limit") ?? "10");
  const search = (url.searchParams.get("search") ?? "").toLowerCase();
  const type = url.searchParams.get("productType");
  const matches = products.filter(
    (product) =>
      (!search || product.productName.toLowerCase().includes(search)) &&
      (!type || (type === "MAIN") === product.isOptions),
  );
  return fulfillJson(route, 200, {
    success: true,
    message: "",
    data: matches.slice((page - 1) * limit, page * limit),
    totalRecords: matches.length,
    totalPage: Math.ceil(matches.length / limit),
    page,
  });
}

export const serverError = { success: false, message: "Internal server error", data: null, statusCode: 500 };

export interface ProductApiMocks {
  list?: (route: Route, url: URL) => Promise<void>;
  details?: (route: Route, id: number) => Promise<void>;
  updateStatus?: (route: Route, id: number, isVisible: boolean) => Promise<void>;
  deleteMany?: (route: Route) => Promise<void>;
}

/** Routes every call to the API origin: product endpoints to the mocks, everything else → empty success. */
export async function mockProductApi(page: Page, mocks: ProductApiMocks): Promise<void> {
  await page.route(API_PATTERN, async (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname.replace(/\/+$/, "");
    const details = /\/products\/details\/(\d+)$/.exec(path);
    const status = /\/products\/update-status\/(\d+)\/(yes|no)$/.exec(path);

    if (/\/products\/get-products-by-category$/.test(path) || /\/products$/.test(path)) {
      if (mocks.list) return mocks.list(route, url);
    } else if (details) {
      if (mocks.details) return mocks.details(route, Number(details[1]));
      return fulfillJson(route, 400, { success: false, message: "productNotFound", data: null, statusCode: 400 });
    } else if (status) {
      if (mocks.updateStatus) return mocks.updateStatus(route, Number(status[1]), status[2] === "yes");
    } else if (/\/products\/delete$/.test(path)) {
      if (mocks.deleteMany) return mocks.deleteMany(route);
    }
    // Category pickers and anything else: an empty success envelope
    return fulfillJson(route, 200, { success: true, message: "", data: [], totalRecords: 0, totalPage: 0, page: 1 });
  });
}

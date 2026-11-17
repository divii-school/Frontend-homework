import fs from "node:fs";
import path from "node:path";
import { expect, type APIRequestContext, type ConsoleMessage, type Page } from "@playwright/test";
import { ADMIN_STORAGE_STATE, SESSION_STORAGE_KEY } from "./helpers";

// Shared steps for the product form specs (product-form.spec.ts, product-form-states.spec.ts,
// products.mutation.spec.ts). Field labels are the visible <label>s of the form.

export const CREATE_URL = "/shopping-mall/products/create";
export const PNG_FIXTURE = path.join(__dirname, "fixtures", "hw3-product-small.png");
export const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "").replace(/\/+$/, "");

// ---- Console guard: every spec fails on console errors / warnings ---------------------------------

type ConsoleFilter = (message: ConsoleMessage) => boolean;

/** Collects console errors / warnings + uncaught page errors. `allow()` whitelists expected ones. */
export function watchConsole(page: Page) {
  const problems: string[] = [];
  const allowed: ConsoleFilter[] = [];
  page.on("console", (message) => {
    if (message.type() !== "error" && message.type() !== "warning") return;
    if (allowed.some((filter) => filter(message))) return;
    problems.push(`${message.type()}: ${message.text()} (${message.location().url})`);
  });
  page.on("pageerror", (error) => problems.push(`pageerror: ${error.message}`));
  return {
    problems,
    /** e.g. allow((m) => m.text().startsWith("Failed to load resource")) for a mocked 500. */
    allow: (filter: ConsoleFilter) => allowed.push(filter),
  };
}

/** The browser logs "Failed to load resource" for every 4xx / 5xx / aborted request. */
export const isFailedResourceLog: ConsoleFilter = (message) => message.text().startsWith("Failed to load resource");

// ---- Form fields -----------------------------------------------------------------------------------

/** A visible text input by its accessible name (the required "*" is aria-hidden, so it is not part of it). */
export function field(page: Page, label: string) {
  return page.getByRole("textbox", { name: label, exact: true });
}

/** Opens a PrimeReact Dropdown by its inputId and picks an option. */
export async function chooseOption(page: Page, inputId: string, option: string | "first") {
  await page.locator(".p-dropdown").filter({ has: page.locator(`#${inputId}`) }).click();
  const panel = page.locator(".p-dropdown-panel");
  await expect(panel).toBeVisible();
  const item = option === "first" ? panel.getByRole("option").first() : panel.getByRole("option", { name: option, exact: true });
  await item.click();
  await expect(panel).toBeHidden();
}

export function stepHeading(page: Page, step: number) {
  return page.locator(`#product-step-${step}-title`);
}

export async function expectStep(page: Page, step: number) {
  await expect(page).toHaveURL(new RegExp(`[?&]step=${step}(&|$)`));
  await expect(stepHeading(page, step)).toBeVisible();
}

export async function clickNext(page: Page) {
  await page.getByRole("button", { name: "Next", exact: true }).click();
}

export interface Step1Values {
  name: string;
  price: string;
  selling: string;
  description?: string;
}

export async function fillStep1(page: Page, values: Step1Values) {
  await field(page, "Product name").fill(values.name);
  await field(page, "Unit price").fill(values.price);
  await field(page, "Selling price").fill(values.selling);
  await field(page, "Detailed description").fill(values.description ?? "HW3 e2e product — created by Playwright.");
}

/** Step 2: upload the PNG fixture, Exposure = Yes, Sales = Yes. */
export async function completeStep2(page: Page) {
  await page.locator("#product-images-input").setInputFiles(PNG_FIXTURE);
  await expect(page.getByRole("button", { name: /^Remove image 1:/ })).toBeVisible({ timeout: 30_000 });
  await chooseOption(page, "product-is-visible", "Yes");
  await chooseOption(page, "product-on-sale", "Yes");
}

export async function completeStep3(page: Page, path: { category: string; subCategory: string; childCategory: string }) {
  await chooseOption(page, "product-category", path.category);
  await chooseOption(page, "product-sub-category", path.subCategory);
  await chooseOption(page, "product-child-category", path.childCategory);
}

export async function fillStep4(page: Page, erpName: string) {
  await field(page, "ERP product name").fill(erpName);
  await field(page, "Quantity").fill("1");
  await chooseOption(page, "product-tax-type", "Taxable");
  await field(page, "ERP unit price").fill("9000");
}

// ---- Real API access for setup / cleanup (live specs only) -----------------------------------------

/** Bearer token of the saved admin session (e2e/.auth/admin.json, written by auth.setup.ts). */
export function readSavedToken(): string {
  const state = JSON.parse(fs.readFileSync(ADMIN_STORAGE_STATE, "utf-8")) as {
    origins?: Array<{ localStorage?: Array<{ name: string; value: string }> }>;
  };
  for (const origin of state.origins ?? []) {
    const entry = origin.localStorage?.find((item) => item.name === SESSION_STORAGE_KEY);
    if (entry) return (JSON.parse(entry.value) as { token: string }).token;
  }
  throw new Error("No saved admin session — run the setup project first.");
}

export function apiHeaders(token: string): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
    "accept-language": "en",
    "x-talking-club-platform": "web",
    "x-talking-club-version": "1.0.0",
  };
}

export interface CategoryPath {
  category: string;
  subCategory: string;
  childCategory: string;
}

interface Envelope<T> {
  data: T;
}

/** First Major → Medium → Minor path that has all three levels (from the product form pickers). */
export async function findCategoryPath(api: APIRequestContext, token: string): Promise<CategoryPath> {
  const get = async <T,>(url: string): Promise<T> => {
    const response = await api.get(`${API_BASE}${url}`, { headers: apiHeaders(token) });
    expect(response.ok(), `GET ${url} → ${response.status()}`).toBeTruthy();
    return ((await response.json()) as Envelope<T>).data;
  };
  type Option = { id: number; name: string };
  for (const category of await get<Option[]>("/products/categories")) {
    for (const sub of await get<Option[]>(`/products/subcategories/${category.id}`)) {
      const children = await get<Option[]>(`/products/childcategories/${sub.id}`);
      if (children.length > 0) return { category: category.name, subCategory: sub.name, childCategory: children[0].name };
    }
  }
  throw new Error("No category with all three levels on the QA server.");
}

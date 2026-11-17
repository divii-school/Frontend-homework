import dayjs from "dayjs";
import type { Product } from "@/api-services/ProductService.types";
import type { PaginatedResult } from "@/types/api";
import { formatCategoryPath, formatDateTime } from "@/utils/format";

// =====================================================================================
// CSV export of the CURRENT FILTERED RESULT — every page, not only the one on screen.
//  1. fetchAllProductPages() asks the API page by page (100 rows each) with the same search and
//     filters as the screen, reporting progress, until totalPage is reached.
//  2. buildProductsCsv() writes the header + one line per product. It starts with a UTF-8 BOM so
//     Excel opens Korean names correctly, and quotes cells that contain , " or line breaks.
//  3. downloadTextFile() hands the text to the browser as products-YYYYMMDD-HHmm.csv.
// =====================================================================================

export const EXPORT_PAGE_SIZE = 100;
/** Safety stop: 100 pages × 100 rows = 10,000 products. */
export const EXPORT_MAX_PAGES = 100;

export const CSV_HEADER = [
  "ID",
  "Product code",
  "Product name",
  "List price",
  "Selling price",
  "Category path",
  "Visible",
  "On sale",
  "Registered at",
] as const;

const UTF8_BOM = "﻿";
const LINE_BREAK = "\r\n";

type CsvValue = string | number | null | undefined;

/**
 * One CSV cell: quoted when it contains a comma, quote or line break (quotes doubled).
 * Text starting with = + - @ (or a tab / CR) gets a leading ' so Excel never runs it as a formula.
 */
export function toCsvCell(value: CsvValue): string {
  if (value === null || value === undefined) return "";
  let text = String(value);
  if (typeof value === "string" && /^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

const yesNo = (flag: boolean) => (flag ? "Yes" : "No");

/** Prices stay plain numbers so Excel can add them up. */
function toCsvRow(product: Product): CsvValue[] {
  return [
    product.id,
    product.productCode,
    product.productName,
    product.price,
    product.unitPrice,
    formatCategoryPath(product.category, product.subCategory, product.childCategory),
    yesNo(product.isVisible),
    yesNo(product.onSale),
    formatDateTime(product.createdAt),
  ];
}

export function buildProductsCsv(products: readonly Product[]): string {
  const lines = [CSV_HEADER, ...products.map(toCsvRow)].map((cells) => cells.map(toCsvCell).join(","));
  return UTF8_BOM + lines.join(LINE_BREAK) + LINE_BREAK;
}

/** products-20261113-1542.csv */
export function csvFileName(now: Date = new Date()): string {
  return `products-${dayjs(now).format("YYYYMMDD-HHmm")}.csv`;
}

/**
 * Loads every page of one filtered result. `fetchPage(page)` does the request (the screen passes a
 * TanStack Query fetch); `onProgress(done, total)` runs after each page; `isCancelled()` stops early
 * (e.g. the user left the screen).
 */
export async function fetchAllProductPages(
  fetchPage: (page: number) => Promise<PaginatedResult<Product>>,
  onProgress: (done: number, total: number) => void,
  isCancelled: () => boolean = () => false,
): Promise<Product[]> {
  const products: Product[] = [];
  let totalPage = 1;
  for (let page = 1; page <= Math.min(totalPage, EXPORT_MAX_PAGES); page += 1) {
    if (isCancelled()) break;
    const result = await fetchPage(page);
    products.push(...result.items);
    totalPage = Math.max(1, result.totalPage);
    onProgress(page, Math.min(totalPage, EXPORT_MAX_PAGES));
    if (result.items.length === 0) break;
  }
  return products;
}

/** Saves text as a file through a temporary link (no new window, no server round trip). */
export function downloadTextFile(content: string, fileName: string, mimeType = "text/csv;charset=utf-8"): void {
  const url = URL.createObjectURL(new Blob([content], { type: mimeType }));
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  link.remove();
  // Give the browser a moment to start the download before the URL is released
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

import dayjs from "dayjs";

// WM display formats:
//  - date + time → YYYY/MM/DD HH:mm   (design 8.1.0 ⑪ "Registration Date")
//  - money       → ₩1,000             (design 8.1.0 ⑧ — won sign + three-digit comma, no decimals)
//  - numbers     → three-digit comma
// Missing / invalid values show "-" (design: "display '-' if none").

export const EMPTY_VALUE = "-";

/** "2025-09-12T08:10:18.000Z" → "2025/09/12 17:10" (browser local time). */
export function formatDateTime(value: string | number | Date | null | undefined): string {
  if (value === null || value === undefined || value === "") return EMPTY_VALUE;
  const date = dayjs(value);
  return date.isValid() ? date.format("YYYY/MM/DD HH:mm") : EMPTY_VALUE;
}

/** "2025-09-12T08:10:18.000Z" → "2025/09/12". */
export function formatDate(value: string | number | Date | null | undefined): string {
  if (value === null || value === undefined || value === "") return EMPTY_VALUE;
  const date = dayjs(value);
  return date.isValid() ? date.format("YYYY/MM/DD") : EMPTY_VALUE;
}

/** 1234567 → "1,234,567". */
export function formatNumber(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === "") return EMPTY_VALUE;
  const numeric = typeof value === "number" ? value : Number(value);
  if (Number.isNaN(numeric)) return EMPTY_VALUE;
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(numeric);
}

/** 1000 → "₩1,000"; -500 → "-₩500". */
export function formatWon(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === "") return EMPTY_VALUE;
  const numeric = typeof value === "number" ? value : Number(value);
  if (Number.isNaN(numeric)) return EMPTY_VALUE;
  const sign = numeric < 0 ? "-" : "";
  return `${sign}₩${formatNumber(Math.abs(numeric))}`;
}

/** Category path "Top > Middle > Minor"; missing levels show "-" (design 8.1.0 ⑨). */
export function formatCategoryPath(
  ...levels: Array<{ name: string } | null | undefined>
): string {
  return levels.map((level) => level?.name?.trim() || EMPTY_VALUE).join(" > ");
}

import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);
dayjs.extend(timezone);

// WM display formats:
//  - date + time → YYYY/MM/DD HH:mm   (design 8.1.0 ⑪ "Registration Date"), always in Korea time (KST)
//  - money       → ₩1,000             (design 8.1.0 ⑧ — won sign + three-digit comma, no decimals)
//  - numbers     → three-digit comma
// Missing / invalid values show "-" (design: "display '-' if none").

export const EMPTY_VALUE = "-";

/**
 * Every date the app shows is Korea time, whatever the viewer's computer is set to: the admin tool is used
 * by the Korean team, and QA in India must see the same time for the same record (QA round, 18 Nov).
 */
export const DISPLAY_TIME_ZONE = "Asia/Seoul";

function toDisplayZone(value: string | number | Date) {
  const date = dayjs(value);
  return date.isValid() ? date.tz(DISPLAY_TIME_ZONE) : null;
}

/** "2025-09-12T08:10:18.000Z" → "2025/09/12 17:10" (KST). */
export function formatDateTime(value: string | number | Date | null | undefined): string {
  if (value === null || value === undefined || value === "") return EMPTY_VALUE;
  const date = toDisplayZone(value);
  return date ? date.format("YYYY/MM/DD HH:mm") : EMPTY_VALUE;
}

/** "2025-09-12T20:10:18.000Z" → "2025/09/13" (KST). */
export function formatDate(value: string | number | Date | null | undefined): string {
  if (value === null || value === undefined || value === "") return EMPTY_VALUE;
  const date = toDisplayZone(value);
  return date ? date.format("YYYY/MM/DD") : EMPTY_VALUE;
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

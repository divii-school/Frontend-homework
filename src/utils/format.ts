// WM | Three digit comma rule: every number shown to a user is grouped in thousands, "in any case".
const grouped = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });

/** 1711 -> "1,711" */
export const formatCount = (value: number): string => grouped.format(value);

/**
 * Money as the Figma description of 상품 관리 asks (design review of 18 Nov, which settles Q5): the won sign, then
 * the amount with thousands commas, no decimals. 1980000 -> "₩1,980,000"
 */
export const formatWon = (value: number): string => `₩${grouped.format(value)}`;

/** The server's time zone: dates are shown as the server (Korea) has them, whatever the viewer's clock says. */
export const SERVER_TIME_ZONE = "Asia/Seoul";

const dateTimeParts = new Intl.DateTimeFormat("en-US", {
  timeZone: SERVER_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

/** Figma 8.1.0: "YYYY/MM/DD HH:MM" in server time. -> "2026/11/13 14:39" */
export function formatDateTime(instant: string): string {
  const parts = Object.fromEntries(dateTimeParts.formatToParts(new Date(instant)).map((part) => [part.type, part.value]));
  return `${parts.year}/${parts.month}/${parts.day} ${parts.hour}:${parts.minute}`;
}

/** 5242880 -> "5MB" for the image size hint */
export const formatMegabytes = (bytes: number): string => `${grouped.format(Math.round(bytes / (1024 * 1024)))}MB`;

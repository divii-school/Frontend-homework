// WM | Three digit comma rule: every number shown to a user is grouped in thousands, "in any case".
const grouped = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });

/** 1711 -> "1,711" */
export const formatCount = (value: number): string => grouped.format(value);

/** WM (KRW): no decimals, the unit follows with no space. 1980000 -> "1,980,000원" */
export const formatWon = (value: number): string => `${grouped.format(value)}원`;

/** WM | Date format (Korean): no leading zero on month or day. -> "2026년 11월 13일" (viewer's time zone) */
export function formatDate(instant: string): string {
  const date = new Date(instant);
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;
}

/** WM: 오전/오후 goes before the time. -> "2026년 11월 13일 오전 11:09" */
export function formatDateTime(instant: string): string {
  const date = new Date(instant);
  const hours = date.getHours();
  const marker = hours < 12 ? "오전" : "오후";
  const hour12 = String(hours % 12 === 0 ? 12 : hours % 12).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${formatDate(instant)} ${marker} ${hour12}:${minutes}`;
}

/** 5242880 -> "5MB" for the image size hint */
export const formatMegabytes = (bytes: number): string => `${grouped.format(Math.round(bytes / (1024 * 1024)))}MB`;

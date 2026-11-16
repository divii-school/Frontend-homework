/** Display formats (WM rules + Figma 8.1.0 notes). */

const won = new Intl.NumberFormat("ko-KR");

/** 4000 → "₩4,000" (Figma: ₩ sign, comma for thousands). */
export function formatWon(value: number): string {
  return `₩${won.format(value)}`;
}

const dateParts = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Seoul",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

/**
 * ISO date → "YYYY/MM/DD HH:MM" in server time (KST), as the Figma note asks.
 * Invalid input → "-".
 */
export function formatDateTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "-";
  const p = Object.fromEntries(dateParts.formatToParts(date).map((part) => [part.type, part.value]));
  return `${p.year}/${p.month}/${p.day} ${p.hour}:${p.minute}`;
}

/** Major > Middle > Sub; "-" when there is no category (Figma 8.1.0 #9). */
export function formatCategoryPath(parts: ReadonlyArray<{ name: string } | null>): string {
  const names = parts.filter((p): p is { name: string } => Boolean(p)).map((p) => p.name);
  return names.length ? names.join(" > ") : "-";
}

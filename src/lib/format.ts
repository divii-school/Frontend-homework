/** Display formats (WM rules + Figma 8.1.0 notes). */

const won = new Intl.NumberFormat("ko-KR");

/** 4000 → "₩4,000" (Figma: ₩ sign, comma for thousands). */
export function formatWon(value: number): string {
  return `₩${won.format(value)}`;
}

const dateParts = new Intl.DateTimeFormat("en-US", {
  timeZone: "Asia/Seoul",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

/**
 * ISO date → "YYYY/MM/DD HH:MM" (24-hour) in server time (KST), as the Korean Figma 8.1.0 note asks
 * ("YYYY/MM/DD HH:MM 표기(서버 시간 기준)"; design review 2026-11-20). Invalid input → "-".
 */
export function formatDateTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "-";
  const p = Object.fromEntries(dateParts.formatToParts(date).map((part) => [part.type, part.value]));
  return `${p.year}/${p.month}/${p.day} ${p.hour}:${p.minute}`;
}

const plain = new Intl.NumberFormat("ko-KR");

/** Money typed in a form field → digits with thousands commas ("1980000" → "1,980,000"). */
export function formatMoneyInput(raw: string): string {
  const digits = raw.replace(/\D/g, "").replace(/^0+(?=\d)/, "");
  return digits ? plain.format(Number(digits)) : "";
}

/** Major > Middle > Sub; "-" when there is no category (Figma 8.1.0 #9). */
export function formatCategoryPath(parts: ReadonlyArray<{ name: string } | null>): string {
  const names = parts.filter((p): p is { name: string } => Boolean(p)).map((p) => p.name);
  return names.length ? names.join(" > ") : "-";
}

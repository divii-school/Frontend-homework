/**
 * Display formats from WM (Date format · Three digit comma rule).
 * All dates are shown in Korea time, whatever the viewer's computer is set to.
 */
const TIME_ZONE = 'Asia/Seoul';

function partsOf(iso: string): Record<string, string> | null {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).formatToParts(date);
  return Object.fromEntries(parts.map((p) => [p.type, p.value]));
}

/** WM: `2021년 5월 7일` — no leading zeros. */
export function formatDate(iso: string | null | undefined): string {
  const p = iso ? partsOf(iso) : null;
  return p ? `${p.year}년 ${p.month}월 ${p.day}일` : '-';
}

/** WM: `2021년 5월 7일 오후 08:33` — 오전/오후 before the time. */
export function formatDateTime(iso: string | null | undefined): string {
  const p = iso ? partsOf(iso) : null;
  if (!p) return '-';
  const meridiem = p.dayPeriod === 'PM' ? '오후' : '오전';
  return `${p.year}년 ${p.month}월 ${p.day}일 ${meridiem} ${p.hour}:${p.minute}`;
}

/** WM: comma every three digits, always (`2,000,000`, `12,345.5`). */
export function formatNumber(value: number | null | undefined): string {
  return typeof value === 'number' && Number.isFinite(value) ? value.toLocaleString('en-US', { maximumFractionDigits: 2 }) : '-';
}

/** WM: Won amounts have no decimals (`9,900원`). */
export function formatWon(value: number | null | undefined): string {
  return typeof value === 'number' && Number.isFinite(value) ? `${Math.round(value).toLocaleString('en-US')}원` : '-';
}

/** File size for the upload hint, e.g. `4MB`, `512KB`. */
export function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${formatNumber(bytes / (1024 * 1024))}MB`;
  return `${formatNumber(Math.ceil(bytes / 1024))}KB`;
}

/** Screen 8.1.0 list price: "₩4,000" (₩ sign, comma every three digits, no decimals). */
export function formatPriceSymbol(value: number | null | undefined): string {
  return typeof value === 'number' && Number.isFinite(value) ? `₩${Math.round(value).toLocaleString('en-US')}` : '-';
}

/** Screen 8.1.0 registration date: "YYYY/MM/DD HH:MM", Korea time, 24-hour. */
export function formatDateTimeSlash(iso: string | null | undefined): string {
  const date = iso ? new Date(iso) : null;
  if (!date || Number.isNaN(date.getTime())) return '-';
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Seoul',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
      .formatToParts(date)
      .map((p) => [p.type, p.value]),
  );
  return `${parts.year}/${parts.month}/${parts.day} ${parts.hour}:${parts.minute}`;
}

/** "대분류 > 중분류 > 소분류", skipping empty levels; "-" when there is none (8.1.0). */
export function formatCategoryPath(...names: Array<string | null | undefined>): string {
  const present = names.filter((n): n is string => Boolean(n && n.trim()));
  return present.length ? present.join(' > ') : '-';
}

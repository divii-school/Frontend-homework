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

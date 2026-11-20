/** WM formats: dates YYYY/MM/DD HH:mm, money ₩ with thousands separators. */
export function formatDateTime(value: string | number | Date | undefined | null): string {
  if (value === undefined || value === null || value === '') return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}/${p(d.getMonth() + 1)}/${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

export function formatWon(value: number | undefined | null): string {
  if (value === undefined || value === null || Number.isNaN(value)) return '-';
  return `₩${new Intl.NumberFormat('ko-KR').format(value)}`;
}

export function formatNumber(value: number | undefined | null): string {
  if (value === undefined || value === null || Number.isNaN(value)) return '-';
  return new Intl.NumberFormat('ko-KR').format(value);
}

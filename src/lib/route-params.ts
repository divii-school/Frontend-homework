/** "123" → 123; anything else ("abc", "1.5", "-1", "0012x") → null, so the page can 404. */
export function parseProductId(raw: string): number | null {
  if (!/^[1-9]\d{0,9}$/.test(raw)) return null;
  return Number(raw);
}

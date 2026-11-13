import { describe, expect, it } from 'vitest';
import {
  formatBytes,
  formatCategoryPath,
  formatDate,
  formatDateTime,
  formatDateTimeSlash,
  formatNumber,
  formatPriceSymbol,
  formatWon,
} from './format';
import { decodeEntities } from './text';
import { csvCell, toCsv } from './csv';
import { parseProductId } from './route-params';
import { safeReturnTo } from './auth/return-to';

describe('WM formats', () => {
  it('Korean date without leading zeros, in Korea time', () => {
    // 2026-05-06 22:30 UTC is 2026-05-07 07:30 in Seoul.
    expect(formatDate('2026-05-06T22:30:00Z')).toBe('2026년 5월 7일');
    expect(formatDateTime('2026-05-07T11:33:00Z')).toBe('2026년 5월 7일 오후 08:33');
  });

  it('comma every three digits; won with no decimals', () => {
    expect(formatNumber(2000000)).toBe('2,000,000');
    expect(formatNumber(12345.5)).toBe('12,345.5');
    expect(formatWon(9900.4)).toBe('9,900원');
  });

  it('dash for missing values', () => {
    expect(formatDate(null)).toBe('-');
    expect(formatNumber(undefined)).toBe('-');
    expect(formatPriceSymbol(Number.NaN)).toBe('-');
  });
});

describe('8.1.0 list formats', () => {
  it('₩ price and YYYY/MM/DD HH:MM in Korea time', () => {
    expect(formatPriceSymbol(1980000)).toBe('₩1,980,000');
    expect(formatDateTimeSlash('2025-09-12T08:10:18Z')).toBe('2025/09/12 17:10');
  });

  it('category path skips missing levels and shows - when empty', () => {
    expect(formatCategoryPath('학원 Shop', '용품', '이벤트 용품')).toBe('학원 Shop > 용품 > 이벤트 용품');
    expect(formatCategoryPath('학원 Shop', null, undefined)).toBe('학원 Shop');
    expect(formatCategoryPath(null, '', '  ')).toBe('-');
  });

  it('file sizes', () => {
    expect(formatBytes(4 * 1024 * 1024)).toBe('4MB');
    expect(formatBytes(500)).toBe('1KB');
  });
});

describe('helpers', () => {
  it('decodes the HTML entities the API stores', () => {
    expect(decodeEntities('Intro A/B/C/D &amp; Jump Up')).toBe('Intro A/B/C/D & Jump Up');
    expect(decodeEntities('&lt;b&gt; &quot;x&quot; &#39;y&#39;')).toBe('<b> "x" \'y\'');
  });

  it('CSV escapes quotes, commas, line breaks and formula starts', () => {
    expect(csvCell('a,b')).toBe('"a,b"');
    expect(csvCell('say "hi"')).toBe('"say ""hi"""');
    expect(csvCell('=SUM(A1)')).toBe("'=SUM(A1)");
    expect(toCsv(['h1', 'h2'], [[1, null]])).toBe('h1,h2\r\n1,');
  });

  it('accepts only positive whole-number product ids', () => {
    expect(parseProductId('20001')).toBe(20001);
    for (const bad of ['0', '-1', '1.5', 'abc', '007', '']) expect(parseProductId(bad)).toBeNull();
  });

  it('never returns to another site after login (open redirect)', () => {
    expect(safeReturnTo('/shopping/products?page=2')).toBe('/shopping/products?page=2');
    expect(safeReturnTo('https://evil.example')).toBe('/shopping/products');
    expect(safeReturnTo('//evil.example')).toBe('/shopping/products');
    expect(safeReturnTo('/login?returnTo=/x')).toBe('/shopping/products');
    expect(safeReturnTo(null)).toBe('/shopping/products');
  });
});

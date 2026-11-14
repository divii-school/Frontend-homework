import { describe, expect, it } from 'vitest';
import { DEFAULT_LIST_PARAMS, parseListParams, toQueryString } from './product-list-params';

const parse = (query: string) => parseListParams(new URLSearchParams(query));

describe('parseListParams (URL → table state)', () => {
  it('reads a full URL', () => {
    expect(parse('page=3&size=20&type=categoryName&q=ACE')).toEqual({ page: 3, size: 20, type: 'categoryName', q: 'ACE' });
  });

  it('falls back to defaults for bad values instead of failing', () => {
    expect(parse('page=-2&size=999&type=hack')).toEqual(DEFAULT_LIST_PARAMS);
    expect(parse('page=1.5')).toEqual(DEFAULT_LIST_PARAMS);
    expect(parse('page=abc')).toEqual(DEFAULT_LIST_PARAMS);
  });

  it('trims the search and caps its length at 50', () => {
    expect(parse(`q=${encodeURIComponent('  책  ')}`).q).toBe('책');
    expect(parse(`q=${'a'.repeat(80)}`).q).toHaveLength(50);
  });
});

describe('toQueryString (table state → URL)', () => {
  it('leaves defaults out', () => {
    expect(toQueryString(DEFAULT_LIST_PARAMS)).toBe('');
  });

  it('keeps type only when there is a search', () => {
    expect(toQueryString({ ...DEFAULT_LIST_PARAMS, type: 'categoryName' })).toBe('');
    expect(toQueryString({ ...DEFAULT_LIST_PARAMS, type: 'categoryName', q: 'Shop' })).toBe('?q=Shop&type=categoryName');
  });

  it('round-trips', () => {
    const state = { page: 4, size: 50, type: 'productName' as const, q: '노트' };
    expect(parse(toQueryString(state).slice(1))).toEqual(state);
  });
});

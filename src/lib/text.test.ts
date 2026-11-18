import { describe, expect, it } from 'vitest';
import { josa } from './text';

describe('josa (Korean particles)', () => {
  it('을/를, 은/는, 이/가 follow the last syllable', () => {
    expect(josa('수량', '을/를')).toBe('수량을');
    expect(josa('판매가', '을/를')).toBe('판매가를');
    expect(josa('단가', '은/는')).toBe('단가는');
    expect(josa('ERP 단가', '이/가')).toBe('ERP 단가가');
    expect(josa('수량', '이/가')).toBe('수량이');
    expect(josa('소분류', '을/를')).toBe('소분류를');
  });

  it('으로/로: a word ending in ㄹ takes 로', () => {
    expect(josa('서울', '으로/로')).toBe('서울로');
    expect(josa('수량', '으로/로')).toBe('수량으로');
    expect(josa('단가', '으로/로')).toBe('단가로');
  });

  it('a word not ending in Hangul is read as having no final consonant', () => {
    expect(josa('ERP', '을/를')).toBe('ERP를');
  });
});

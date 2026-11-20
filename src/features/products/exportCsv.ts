import { formatDateTime } from '@/lib/format';
import { productService, type ProductListParams } from './productService';
import type { ProductListItem } from './types';

function cell(v: string | number | undefined): string {
  const s = v === undefined ? '' : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** Fetches every page of the CURRENT filter and downloads it as CSV (UTF-8 BOM for Excel). */
export async function exportProductsCsv(filter: Omit<ProductListParams, 'page' | 'limit'>): Promise<number> {
  const limit = 100;
  const first = await productService.list({ ...filter, page: 1, limit });
  const rows: ProductListItem[] = [...first.items];
  for (let page = 2; page <= first.totalPages && page <= 50; page += 1) {
    rows.push(...(await productService.list({ ...filter, page, limit })).items);
  }
  const header = ['상품 ID', '상품코드', '상품명', '판매가', '카테고리', '노출 상태', '판매 상태', '등록일'];
  const lines = rows.map((r) =>
    [r.id, r.code, r.name, r.price, r.categoryPath, r.isVisible === 'yes' ? 'Yes' : 'No', r.onSale === 'yes' ? 'Yes' : 'No', formatDateTime(r.createdAt)]
      .map(cell)
      .join(','),
  );
  const blob = new Blob(['﻿' + [header.join(','), ...lines].join('\n')], { type: 'text/csv;charset=utf-8' });
  const d = new Date();
  const stamp = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `상품목록_${stamp}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
  return rows.length;
}

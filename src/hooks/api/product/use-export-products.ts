import { useCallback, useState } from 'react';
import { ProductService } from '@/services/product-service';
import { downloadCsv, toCsv } from '@/lib/csv';
import { decodeEntities } from '@/lib/text';
import { formatCategoryPath, formatDateTimeSlash } from '@/lib/format';
import type { ProductListItem, ProductListQuery } from '@/types/product';

/** Rows per API call while exporting (fewer calls; the API accepts it). */
const EXPORT_PAGE_SIZE = 100;

const HEADER = ['상품 ID', '상품코드', '상품명', '판매가', '단가', '카테고리', '노출 여부', '판매 여부', 'ERP 코드', 'ERP 상품명', '등록일'];

function toRow(p: ProductListItem) {
  return [
    p.id,
    p.productCode,
    decodeEntities(p.productName),
    p.price,
    p.unitPrice,
    formatCategoryPath(p.category?.name, p.subCategory?.name, p.childCategory?.name),
    p.isVisible ? '예' : '아니오',
    p.onSale ? '예' : '아니오',
    p.erpCode,
    p.erpName,
    formatDateTimeSlash(p.createdAt),
  ];
}

/**
 * Exports EVERY row of the current filter (not just the visible page) as CSV.
 * Walks the pages one by one and reports progress; nothing is downloaded if a page fails.
 */
export function useExportProducts() {
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);

  const exportCsv = useCallback(async (filter: Omit<ProductListQuery, 'page' | 'limit'>) => {
    setProgress({ done: 0, total: 0 });
    try {
      const rows: ProductListItem[] = [];
      let page = 1;
      let totalPage = 1;
      do {
        const result = await ProductService.list({ ...filter, page, limit: EXPORT_PAGE_SIZE });
        rows.push(...result.items);
        totalPage = result.totalPage;
        setProgress({ done: rows.length, total: result.totalRecords });
        page += 1;
      } while (page <= totalPage);
      const stamp = formatDateTimeSlash(new Date().toISOString()).replace(/[/: ]/g, '');
      downloadCsv(`products_${stamp}.csv`, toCsv(HEADER, rows.map(toRow)));
      return rows.length;
    } finally {
      setProgress(null);
    }
  }, []);

  return { exportCsv, progress, exporting: progress !== null };
}

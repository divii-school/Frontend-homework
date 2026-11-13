import { afterEach, describe, expect, it, vi } from 'vitest';
import { httpClient } from '@/lib/api/http-client';
import { ProductService } from './product-service';
import { ProductCategoryService } from './product-category-service';

/**
 * Bodies whose shape the QA server enforces more strictly than its OpenAPI doc.
 * Checked live 2026-11-13: ids as strings → 400 "each value in ids must be a number"; as numbers → 200.
 */
describe('id lists go to the API as numbers', () => {
  afterEach(() => vi.restoreAllMocks());

  it('bulk delete sends { ids: number[] }', async () => {
    const del = vi.spyOn(httpClient, 'delete').mockResolvedValue({ data: {} });
    await ProductService.remove([20002, 20003]);
    expect(del).toHaveBeenCalledWith('/products/delete', { data: { ids: [20002, 20003] } });
  });

  it('category reorder sends { ids: number[] }', async () => {
    const put = vi.spyOn(httpClient, 'put').mockResolvedValue({ data: {} });
    await ProductCategoryService.reorder('childCategory', [573, 12]);
    expect(put.mock.calls[0][1]).toEqual({ ids: [573, 12] });
  });
});

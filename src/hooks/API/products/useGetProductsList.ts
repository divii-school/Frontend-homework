import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { ProductService } from "@/api-services/ProductService";
import type { ApiError, PagedResult } from "@/types/api";
import type { Product, ProductListParams } from "@/types/product";
import { QUERIES } from "@/utils/api-integration";
import { sortProducts } from "@/utils/product-params";

/**
 * The product list for the filters in the URL. Search, category filter and paging are done by the server;
 * the sort is applied to the returned page (the API has no sort parameter).
 * keepPreviousData: the old rows stay on screen while the next page loads, so the table does not jump.
 */
export function useGetProductsList(params: ProductListParams) {
  return useQuery<PagedResult<Product>, ApiError>({
    queryKey: QUERIES.products.list(params),
    queryFn: async () => {
      const result = await ProductService.list(params);
      return { ...result, items: sortProducts(result.items, params.sort, params.order) };
    },
    placeholderData: keepPreviousData,
  });
}

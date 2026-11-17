"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "primereact/button";
import { useQueryClient } from "@tanstack/react-query";
import ProductService from "@/api-services/ProductService";
import { toApiError } from "@/api-services/CoreAPIService";
import type { ProductListQuery } from "@/api-services/ProductService.types";
import { useToast } from "@/providers/ToastProvider";
import { formatNumber } from "@/utils/format";
import { queryKeys } from "@/utils/query-keys";
import {
  buildProductsCsv,
  csvFileName,
  downloadTextFile,
  EXPORT_PAGE_SIZE,
  fetchAllProductPages,
} from "./export-csv";
import { sortProducts, type SortField, type SortOrder } from "./list-url-state";

interface ExportCsvButtonProps {
  /** The screen's API query (same search + filters); page / limit are replaced while exporting. */
  query: ProductListQuery;
  sort: SortField | null;
  order: SortOrder;
  totalRecords: number;
}

// "Export CSV" (checklist C): downloads the whole filtered result, page by page, with progress.
// Each page goes through queryClient.fetchQuery with the normal list key, so it is cached and
// cancelled like any other list request.
export default function ExportCsvButton({ query, sort, order, totalRecords }: ExportCsvButtonProps) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const cancelled = useRef(false);

  // Leaving the screen stops the loop after the current page
  useEffect(() => {
    cancelled.current = false;
    return () => {
      cancelled.current = true;
    };
  }, []);

  const exportCsv = async () => {
    setProgress({ done: 0, total: Math.max(1, Math.ceil(totalRecords / EXPORT_PAGE_SIZE)) });
    try {
      const products = await fetchAllProductPages(
        (page) => {
          const pageQuery: ProductListQuery = { ...query, page, limit: EXPORT_PAGE_SIZE };
          return queryClient.fetchQuery({
            queryKey: queryKeys.products.list(pageQuery),
            queryFn: ({ signal }) => ProductService.getProductList(pageQuery, signal),
          });
        },
        (done, total) => {
          if (!cancelled.current) setProgress({ done, total });
        },
        () => cancelled.current,
      );
      if (cancelled.current) return;
      // Same order as the screen: the chosen sort now applies to every exported row
      downloadTextFile(buildProductsCsv(sortProducts(products, sort, order)), csvFileName());
      toast.success("CSV exported", `${formatNumber(products.length)} products`);
    } catch (error) {
      if (!cancelled.current) toast.error("Export failed", toApiError(error).message);
    } finally {
      if (!cancelled.current) setProgress(null);
    }
  };

  const label = progress ? `Exporting ${progress.done}/${progress.total}…` : "Export CSV";

  return (
    <>
      <Button
        type="button"
        label={label}
        icon="pi pi-download"
        outlined
        loading={progress !== null}
        disabled={progress !== null || totalRecords === 0}
        onClick={exportCsv}
      />
      <span className="sr-only" role="status">
        {progress ? `Exporting page ${progress.done} of ${progress.total}` : ""}
      </span>
    </>
  );
}

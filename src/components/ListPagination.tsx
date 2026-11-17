"use client";

import { useEffect, useState } from "react";
import { Paginator, type PaginatorPageChangeEvent } from "primereact/paginator";
import { PAGE_SIZE_OPTIONS } from "@/utils/constants";

interface ListPaginationProps {
  /** 1-based page, same as the API. */
  page: number;
  limit: number;
  totalRecords: number;
  onChange: (next: { page: number; limit: number }) => void;
  /** Show the rows-per-page dropdown (design 8.1.0 has none: fixed 10 per page). */
  showPageSize?: boolean;
}

// Page links under a table (design 8.1.0 ⑫). Converts PrimeReact's 0-based offset to the API's 1-based page.
export default function ListPagination({ page, limit, totalRecords, onChange, showPageSize = false }: ListPaginationProps) {
  // Phones (≤ 480 px, the 'xs' breakpoint): 5 page links instead of 10, so the 44 px touch-target
  // links and the two arrows stay on one line
  const [linkSize, setLinkSize] = useState(10);
  useEffect(() => {
    const query = window.matchMedia("(max-width: 480px)");
    const apply = () => setLinkSize(query.matches ? 5 : 10);
    apply();
    query.addEventListener("change", apply);
    return () => query.removeEventListener("change", apply);
  }, []);

  const handleChange = (event: PaginatorPageChangeEvent) => {
    onChange({ page: event.page + 1, limit: event.rows });
  };

  if (totalRecords <= 0) return null;

  return (
    <nav className="list-pagination" aria-label="페이지네이션">
      <Paginator
        first={(page - 1) * limit}
        rows={limit}
        totalRecords={totalRecords}
        rowsPerPageOptions={showPageSize ? [...PAGE_SIZE_OPTIONS] : undefined}
        pageLinkSize={linkSize}
        onPageChange={handleChange}
        template={
          showPageSize ? "PrevPageLink PageLinks NextPageLink RowsPerPageDropdown" : "PrevPageLink PageLinks NextPageLink"
        }
      />
    </nav>
  );
}

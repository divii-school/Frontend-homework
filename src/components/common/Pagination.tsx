import { Paginator } from "primereact/paginator";
import { PAGE_SIZE_OPTIONS } from "@/constants/products";

interface PaginationProps {
  page: number;
  limit: number;
  totalRecords: number;
  onChange: (page: number, limit: number) => void;
}

/** Page numbers + rows per page. PrimeReact counts from row 0; the app and the API count pages from 1. */
export function Pagination({ page, limit, totalRecords, onChange }: PaginationProps) {
  return (
    <Paginator
      className="pagination"
      first={(page - 1) * limit}
      rows={limit}
      totalRecords={totalRecords}
      rowsPerPageOptions={[...PAGE_SIZE_OPTIONS]}
      template="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown"
      onPageChange={(event) => onChange(event.rows === limit ? event.page + 1 : 1, event.rows)}
    />
  );
}

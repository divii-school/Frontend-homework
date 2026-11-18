import { Dropdown } from "primereact/dropdown";
import { Paginator, type PaginatorTemplate } from "primereact/paginator";
import { PAGE_SIZE_OPTIONS } from "@/constants/products";

interface PaginationProps {
  page: number;
  limit: number;
  totalRecords: number;
  onChange: (page: number, limit: number) => void;
}

const ROWS_PER_PAGE_LABEL = "페이지당 행 수";

/**
 * PrimeReact's own layout, with one change: the rows-per-page box is drawn here so it gets a Korean name. PrimeReact
 * 10.9 names its own box from a private copy of its English texts ("Jump to Page Dropdown"), which the Korean locale
 * does not reach (QA, 18 Nov). Same Dropdown, same values and the same change handler as PrimeReact's.
 */
const TEMPLATE: PaginatorTemplate = {
  layout: "FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown",
  RowsPerPageDropdown: (options) => (
    <Dropdown
      value={options.value}
      options={options.options}
      onChange={options.onChange}
      appendTo={options.appendTo}
      disabled={options.disabled}
      aria-label={ROWS_PER_PAGE_LABEL}
    />
  ),
};

/** Page numbers + rows per page. PrimeReact counts from row 0; the app and the API count pages from 1. */
export function Pagination({ page, limit, totalRecords, onChange }: PaginationProps) {
  return (
    <Paginator
      className="pagination"
      first={(page - 1) * limit}
      rows={limit}
      totalRecords={totalRecords}
      rowsPerPageOptions={[...PAGE_SIZE_OPTIONS]}
      template={TEMPLATE}
      onPageChange={(event) => onChange(event.rows === limit ? event.page + 1 : 1, event.rows)}
    />
  );
}

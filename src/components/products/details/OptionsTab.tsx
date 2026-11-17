"use client";

import Link from "next/link";
import { StateWrapper, TableSkeleton } from "@/components";
import { useGetProductDetails } from "@/hooks/API/products/useGetProductDetails";
import { formatWon } from "@/utils/format";
import { PRODUCT_ROUTES } from "../list/product-routes";

const OPTION_TYPE_LABELS: Record<string, string> = {
  SINGLE_VOLUME: "Single item",
  CATEGORY_OPTION: "Category option",
};

// Options tab: the product's option sets (design 8.1.3) — one table per group with code / name / price.
// Each option is itself a product, so its name links to that product's details.
export default function OptionsTab({ productId }: { productId: number }) {
  const details = useGetProductDetails(productId);
  const groups = details.data?.productOptions ?? [];

  return (
    <StateWrapper
      isLoading={details.isPending}
      isError={details.isError}
      error={details.error}
      onRetry={() => void details.refetch()}
      isEmpty={groups.length === 0}
      loadingFallback={<TableSkeleton rows={4} columns={3} label="Loading options…" />}
      emptyIcon="pi pi-list"
      emptyTitle="No options"
      emptyDescription={
        details.data?.isOptions ? "This main product has no option sets yet." : "Supplementary products have no options."
      }
    >
      <div className="details-option-groups">
        {groups.map((group, index) => {
          const headingId = `product-option-group-${index}`;
          const typeLabel = OPTION_TYPE_LABELS[group.type] ?? group.type;
          return (
            <section key={`${group.optionGroup}-${group.type}`} className="details-option-group" aria-labelledby={headingId}>
              <h2 id={headingId} className="product-section-title">
                Option group {group.optionGroup}
                <span className="product-badge">{typeLabel}</span>
              </h2>
              {group.option.length === 0 ? (
                <p className="field-hint">No options in this group.</p>
              ) : (
                <div className="table-scroll-box">
                  <table className="details-option-table">
                    <caption className="sr-only">
                      Options of group {group.optionGroup} ({typeLabel})
                    </caption>
                    <thead>
                      <tr>
                        <th scope="col">Option code</th>
                        <th scope="col">Option name</th>
                        <th scope="col">Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.option.map((option) => (
                        <tr key={option.optionId}>
                          <td>{option.optionCode || "-"}</td>
                          <td>
                            <Link href={PRODUCT_ROUTES.details(option.optionId)}>{option.optionName}</Link>
                          </td>
                          <td>{formatWon(option.price)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          );
        })}
      </div>
    </StateWrapper>
  );
}

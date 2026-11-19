"use client";

import Link from "next/link";
import { StateWrapper, TableSkeleton } from "@/components";
import { useGetProductDetails } from "@/hooks/API/products/useGetProductDetails";
import { formatWon } from "@/utils/format";
import { PRODUCT_ROUTES } from "../list/product-routes";

const OPTION_TYPE_LABELS: Record<string, string> = {
  SINGLE_VOLUME: "단권 옵션",
  CATEGORY_OPTION: "카테고리 옵션",
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
      loadingFallback={<TableSkeleton rows={4} columns={3} label="옵션을 불러오는 중…" />}
      emptyIcon="pi pi-list"
      emptyTitle="옵션 없음"
      emptyDescription={
        details.data?.isOptions ? "이 상품에는 아직 등록된 옵션이 없습니다." : "단권 상품에는 옵션이 없습니다."
      }
    >
      <div className="details-option-groups">
        {groups.map((group, index) => {
          const headingId = `product-option-group-${index}`;
          const typeLabel = OPTION_TYPE_LABELS[group.type] ?? group.type;
          return (
            <section key={`${group.optionGroup}-${group.type}`} className="details-option-group" aria-labelledby={headingId}>
              <h2 id={headingId} className="product-section-title">
                옵션 {group.optionGroup}번
                <span className="product-badge">{typeLabel}</span>
              </h2>
              {group.option.length === 0 ? (
                <p className="field-hint">이 옵션에 등록된 상품이 없습니다.</p>
              ) : (
                <div className="table-scroll-box">
                  <table className="details-option-table">
                    <caption className="sr-only">
                      옵션 {group.optionGroup}번 ({typeLabel}) 상품 목록
                    </caption>
                    <thead>
                      <tr>
                        <th scope="col">상품코드</th>
                        <th scope="col">도서명</th>
                        <th scope="col">판매가</th>
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

"use client";

import Link from "next/link";
import { useRef, type KeyboardEvent } from "react";
import { PageHeading } from "@/components/common/PageHeading";
import { ErrorState, StateBlock } from "@/components/common/StateBlock";
import { ProductThumbnail } from "@/components/products/ProductThumbnail";
import { categoryPath } from "@/components/products/ProductsTable";
import { useAuth } from "@/components/providers/AuthProvider";
import { NAV_GROUP_LABEL, canDo } from "@/config/navigation";
import { PREVIEW_SIZE, THUMBNAIL_SIZE } from "@/constants/design";
import { PRODUCT_TABS, type ProductTabKey } from "@/constants/products";
import { ROUTES } from "@/constants/routes";
import { useGetCategoryTree } from "@/hooks/API/categories/useCategories";
import { useGetProductDetails, useGetRelatedProducts } from "@/hooks/API/products/useGetProductDetails";
import { useUrlParam } from "@/hooks/useUrlParam";
import type { Product } from "@/types/product";
import { formatCount, formatDateTime, formatWon } from "@/utils/format";

const TAB_KEYS = PRODUCT_TABS.map((tab) => tab.key);
const TAX_LABEL: Record<Product["taxType"], string> = { tax: "과세", tax_free: "비과세" };

/** Tab 1: the product's own fields (GET /products/details/{id}). */
function InfoTab({ id }: { id: number }) {
  const product = useGetProductDetails(id);
  if (product.isPending) return <StateBlock kind="loading" title="상품 정보를 불러오는 중입니다." />;
  if (product.isError) return <ErrorState error={product.error} onRetry={() => product.refetch()} />;

  const item = product.data;
  const rows: Array<[string, string]> = [
    ["상품코드", item.productCode],
    ["상품명", item.productName],
    ["상품 ERP명", item.erpName],
    ["ERP 코드", item.erpCode ?? "-"],
    ["과세 구분", TAX_LABEL[item.taxType] ?? item.taxType],
    ["수량", formatCount(item.quantity)],
    ["단가", formatWon(item.unitPrice)],
    ["ERP 단가", formatWon(item.erpUnitPrice)],
    ["판매가", formatWon(item.price)],
    ["노출상태", item.isVisible ? "예" : "아니오"],
    ["판매상태", item.onSale ? "예" : "아니오"],
    ["등록일자", formatDateTime(item.createdAt)],
    ["수정일자", formatDateTime(item.updatedAt)],
  ];
  return (
    <>
      <dl className="details-list">
        {rows.map(([label, value]) => (
          <div className="details-row" key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
        <div className="details-row details-row-wide">
          <dt>상세설명</dt>
          <dd className="details-description">{item.description || "-"}</dd>
        </div>
      </dl>
      <h3 className="details-subtitle">이미지</h3>
      {item.images.length === 0 ? (
        <StateBlock kind="empty" title="등록된 이미지가 없습니다." />
      ) : (
        <ul className="details-images">
          {item.images.map((address) => (
            <li key={address}>
              <ProductThumbnail src={address} alt={`${item.productName} 이미지`} size={PREVIEW_SIZE} />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

/** Tab 2: where the product sits in the category tree (GET /product-category/list, searched by the 대분류 name). */
function CategoryTab({ id }: { id: number }) {
  const product = useGetProductDetails(id);
  const tree = useGetCategoryTree(product.data?.category?.name ?? "");
  if (product.isPending || (product.isSuccess && tree.isPending)) return <StateBlock kind="loading" title="카테고리를 불러오는 중입니다." />;
  if (product.isError) return <ErrorState error={product.error} onRetry={() => product.refetch()} />;
  if (tree.isError) return <ErrorState error={tree.error} onRetry={() => tree.refetch()} />;

  const category = tree.data?.find((item) => item.id === product.data.category?.id);
  const sub = category?.subCategories.find((item) => item.id === product.data.subCategory?.id);
  if (!category) return <StateBlock kind="empty" title="이 상품에 연결된 카테고리가 없습니다." />;
  return (
    <dl className="details-list">
      <div className="details-row details-row-wide">
        <dt>카테고리 경로</dt>
        <dd>{categoryPath(product.data)}</dd>
      </div>
      <div className="details-row">
        <dt>대분류의 중분류 수</dt>
        <dd>{formatCount(category.subCategories.length)}개</dd>
      </div>
      <div className="details-row">
        <dt>중분류의 소분류 수</dt>
        <dd>{sub ? `${formatCount(sub.childCategories.length)}개` : "-"}</dd>
      </div>
    </dl>
  );
}

/** Tab 3: other products of the same 소분류 (GET /products/get-products-by-category). */
function RelatedTab({ id }: { id: number }) {
  const product = useGetProductDetails(id);
  const childCategoryId = product.data?.childCategory?.id ?? null;
  const related = useGetRelatedProducts(childCategoryId, product.isSuccess);
  if (product.isPending || (childCategoryId !== null && related.isPending)) return <StateBlock kind="loading" title="상품을 불러오는 중입니다." />;
  if (product.isError) return <ErrorState error={product.error} onRetry={() => product.refetch()} />;
  if (related.isError) return <ErrorState error={related.error} onRetry={() => related.refetch()} />;

  const others = (related.data?.items ?? []).filter((item) => item.id !== id);
  if (others.length === 0) return <StateBlock kind="empty" title="같은 카테고리의 다른 상품이 없습니다." />;
  return (
    <ul className="related-list">
      {others.map((item) => (
        <li className="related-item" key={item.id}>
          <ProductThumbnail src={item.image} alt="" size={THUMBNAIL_SIZE} />
          <Link className="data-table-link" href={ROUTES.productDetails(item.id)}>
            {item.productName}
          </Link>
          <span>{formatWon(item.price)}</span>
        </li>
      ))}
    </ul>
  );
}

const TAB_PANELS: Record<ProductTabKey, (props: { id: number }) => React.ReactNode> = {
  info: InfoTab,
  category: CategoryTab,
  related: RelatedTab,
};

/**
 * /products/[id]. The open tab is in the URL (?tab=category). Only the open tab's component is mounted, so only
 * its queries run: each tab loads its own data and shows its own loading, empty and error state.
 */
export function ProductDetailsScreen({ id }: { id: number }) {
  const { user } = useAuth();
  const [tab, setTab] = useUrlParam("tab", TAB_KEYS);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const Panel = TAB_PANELS[tab];
  const validId = Number.isInteger(id) && id > 0;

  // Arrow keys move between tabs, as the WAI-ARIA tabs pattern asks.
  const handleKeyDown = (event: KeyboardEvent, index: number) => {
    const step = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
    if (step === 0) return;
    const next = (index + step + TAB_KEYS.length) % TAB_KEYS.length;
    setTab(TAB_KEYS[next]);
    tabRefs.current[next]?.focus();
  };

  return (
    <>
      <PageHeading
        title="상품 상세"
        breadcrumb={[NAV_GROUP_LABEL, "상품 관리", "상세"]}
        actions={
          <>
            <Link className="link-button" href={ROUTES.products}>
              목록
            </Link>
            {validId && canDo(user, "product.write") && (
              <Link className="link-button link-button-primary" href={ROUTES.productEdit(id)}>
                수정
              </Link>
            )}
          </>
        }
      />
      {!validId ? (
        <StateBlock kind="not-found" title="상품을 찾을 수 없습니다." />
      ) : (
        <section className="panel">
          <div className="tabs" role="tablist" aria-label="상품 상세 탭">
            {PRODUCT_TABS.map((item, index) => (
              <button
                key={item.key}
                ref={(element) => {
                  tabRefs.current[index] = element;
                }}
                type="button"
                role="tab"
                id={`tab-${item.key}`}
                className={`tabs-tab${item.key === tab ? " tabs-tab-active" : ""}`}
                aria-selected={item.key === tab}
                aria-controls="tab-panel"
                tabIndex={item.key === tab ? 0 : -1}
                onClick={() => setTab(item.key)}
                onKeyDown={(event) => handleKeyDown(event, index)}
              >
                {item.label}
              </button>
            ))}
          </div>
          <div className="tabs-panel" role="tabpanel" id="tab-panel" aria-labelledby={`tab-${tab}`} tabIndex={0}>
            <Panel id={id} />
          </div>
        </section>
      )}
    </>
  );
}

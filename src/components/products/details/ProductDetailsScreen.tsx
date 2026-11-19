"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ErrorState, PageHeader } from "@/components";
import { getBreadcrumb, ROUTE_KEYS } from "@/config/navigation";
import { useCan } from "@/hooks/useCan";
import { useGetProductDetails } from "@/hooks/API/products/useGetProductDetails";
import { PRODUCT_ROUTES, readListUrl, type ProductDetailsTab } from "../list/product-routes";
import DetailsTabs, { parseDetailsTab, tabId, tabPanelId } from "./DetailsTabs";
import OptionsTab from "./OptionsTab";
import OverviewTab from "./OverviewTab";
import SameCategoryTab from "./SameCategoryTab";

/** "12" → 12; "abc", "0", "-1", "1.5" → null (shown as not found, no request). */
function parseProductId(value: string): number | null {
  if (!/^\d+$/.test(value)) return null;
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

// Product details page (not in the design — design question 4).
//  - The active tab lives in the URL (?tab=overview|options|related), so refresh / share keep it.
//  - Only the open tab is rendered, so a tab's query starts the first time it is opened (lazy);
//    TanStack Query keeps the data, so going back to a tab is instant.
//  - Each tab shows its own loading / empty / error state; one failing tab doesn't break the others.
export default function ProductDetailsScreen({ idParam }: { idParam: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const productId = parseProductId(idParam);
  const tab = parseDetailsTab(searchParams.get("tab"));
  const details = useGetProductDetails(productId);
  const canUpdate = useCan(ROUTE_KEYS.PRODUCTS, "update");

  // "Back to list" → the list URL this tab came from (page, search, filters), read after hydration
  const [backHref, setBackHref] = useState<string>(PRODUCT_ROUTES.list);
  useEffect(() => {
    setBackHref(readListUrl());
  }, []);

  const selectTab = (next: ProductDetailsTab) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", next);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const breadcrumb = getBreadcrumb(ROUTE_KEYS.PRODUCTS, "상품 상세");
  const backLink = (
    <Link href={backHref} className="p-button p-component p-button-outlined">
      목록으로
    </Link>
  );

  // Bad id in the URL, or the API says productNotFound → not-found state with a way back
  if (productId === null || details.error?.kind === "not-found") {
    return (
      <div className="product-details-page">
        <PageHeader title="상품 상세" breadcrumb={breadcrumb} />
        <section className="content-card">
          <ErrorState
            variant="not-found"
            title="상품을 찾을 수 없습니다"
            message="존재하지 않거나 삭제된 상품입니다."
            actions={backLink}
          />
        </section>
      </div>
    );
  }

  return (
    <div className="product-details-page">
      <PageHeader
        title={details.data?.productName ?? "상품 상세"}
        breadcrumb={breadcrumb}
        actions={
          <>
            {backLink}
            {canUpdate && (
              <Link href={PRODUCT_ROUTES.edit(productId)} className="p-button p-component">
                수정
              </Link>
            )}
          </>
        }
      />

      <section className="content-card product-details" aria-label="상품 상세">
        <DetailsTabs active={tab} onChange={selectTab} />
        {/* Only the open tab is mounted → its data loads when it is first opened */}
        <div className="details-tabpanel" role="tabpanel" id={tabPanelId(tab)} aria-labelledby={tabId(tab)} tabIndex={0}>
          {tab === "overview" && <OverviewTab productId={productId} />}
          {tab === "options" && <OptionsTab productId={productId} />}
          {tab === "related" && <SameCategoryTab productId={productId} />}
        </div>
      </section>
    </div>
  );
}

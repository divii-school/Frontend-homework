"use client";

import { useCallback, useEffect, useRef, type KeyboardEvent, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { Pagination } from "@/components/ui/Pagination";
import { useProductDetail } from "@/hooks/useProductForm";
import { useProductSessions, useSameCategoryProducts } from "@/hooks/useProductDetailTabs";
import { imageKey, imagePreviewUrl } from "@/services/productForm";
import { ApiError } from "@/services/http";
import { errorMessage } from "@/lib/errors";
import { formatCategoryPath, formatDateTime, formatWon } from "@/lib/format";
import btn from "@/components/ui/Button.module.scss";
import styles from "./ProductDetail.module.scss";

const TABS = [
  { key: "overview", label: "기본 정보" },
  { key: "sessions", label: "연결된 수업" },
  { key: "related", label: "같은 카테고리" },
] as const;
type TabKey = (typeof TABS)[number]["key"];

const isTab = (value: string | null): value is TabKey => TABS.some((t) => t.key === value);

/**
 * Product details with tabs (HW3 4-C; no Figma frame exists for this page).
 * - Active tab and the tab's page live in the URL: ?tab=sessions&page=2
 * - Each tab has its own query, fetched only when the tab is opened, with its own
 *   loading / empty / error state.
 */
export function ProductDetail({ productId }: { productId: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tab: TabKey = isTab(searchParams.get("tab")) ? (searchParams.get("tab") as TabKey) : "overview";
  const page = Math.max(1, Number.parseInt(searchParams.get("page") ?? "1", 10) || 1);
  const tabRefs = useRef<Record<TabKey, HTMLButtonElement | null>>({ overview: null, sessions: null, related: null });
  // Keyboard tab changes go through the URL, so focus moves after the new tab has rendered.
  const focusAfterChange = useRef(false);
  useEffect(() => {
    if (focusAfterChange.current) {
      focusAfterChange.current = false;
      tabRefs.current[tab]?.focus();
    }
  }, [tab]);

  const detail = useProductDetail(productId);

  const setUrl = useCallback(
    (nextTab: TabKey, nextPage = 1) => {
      const query = new URLSearchParams();
      if (nextTab !== "overview") query.set("tab", nextTab);
      if (nextPage > 1) query.set("page", String(nextPage));
      const qs = query.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router],
  );

  // WAI-ARIA tabs: arrow keys / Home / End move between tabs.
  // The index comes from the focused tab button, not from the URL (which updates a moment later).
  function onTabKeyDown(event: KeyboardEvent<HTMLButtonElement>, from: TabKey) {
    const index = TABS.findIndex((t) => t.key === from);
    const moves: Record<string, number> = { ArrowRight: index + 1, ArrowLeft: index - 1, Home: 0, End: TABS.length - 1 };
    if (!(event.key in moves)) return;
    event.preventDefault();
    const next = TABS[(moves[event.key] + TABS.length) % TABS.length].key;
    focusAfterChange.current = true;
    setUrl(next);
    tabRefs.current[next]?.focus();
  }

  const name = detail.data?.productName;

  return (
    <>
      <PageHeader
        title={name ?? "상품 상세"}
        crumb="상품 상세"
        actions={
          <>
            <Link href="/shopping/products" className={`${btn.button} ${btn.outline} ${styles["link-button"]}`}>
              목록으로
            </Link>
            {detail.data && (
              <Link href={`/shopping/products/${productId}/edit`} className={`${btn.button} ${btn.primary} ${styles["link-button"]}`}>
                수정
              </Link>
            )}
          </>
        }
      />

      <div className={styles.content}>
        <div className={styles.tablist} role="tablist" aria-label="상품 상세 탭">
          {TABS.map((t) => (
            <button
              key={t.key}
              ref={(el) => {
                tabRefs.current[t.key] = el;
              }}
              type="button"
              role="tab"
              id={`tab-${t.key}`}
              aria-selected={tab === t.key}
              aria-controls={`panel-${t.key}`}
              tabIndex={tab === t.key ? 0 : -1}
              className={`${styles.tab} ${tab === t.key ? styles["tab-active"] : ""}`}
              onClick={() => setUrl(t.key)}
              onKeyDown={(e) => onTabKeyDown(e, t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`} className={styles.panel} tabIndex={0}>
          {tab === "overview" && <OverviewTab query={detail} />}
          {tab === "sessions" && <SessionsTab productId={productId} page={page} onPage={(p) => setUrl("sessions", p)} />}
          {tab === "related" && (
            <RelatedTab
              productId={productId}
              childCategoryId={detail.data?.childCategory?.id ?? null}
              detailState={detail.isPending ? "loading" : detail.isError ? "error" : "ready"}
              page={page}
              onPage={(p) => setUrl("related", p)}
            />
          )}
        </div>
      </div>
    </>
  );
}

// ---------- shared tab states ----------

function Loading() {
  return (
    <div className={styles.state} role="status">
      <span className={styles.spinner} aria-hidden />
      불러오는 중…
    </div>
  );
}

function ErrorState({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  return (
    <div className={styles.state} role="alert">
      <p>{errorMessage(error)}</p>
      <button type="button" className={`${btn.button} ${btn.outline}`} onClick={onRetry}>
        다시 시도
      </button>
    </div>
  );
}

function Empty({ children }: { children: ReactNode }) {
  return (
    <div className={styles.state} role="status">
      <p>{children}</p>
    </div>
  );
}

// ---------- Overview ----------

function OverviewTab({ query }: { query: ReturnType<typeof useProductDetail> }) {
  if (query.isPending) return <Loading />;
  if (query.isError) {
    const gone = query.error instanceof ApiError && (query.error.status === 404 || query.error.status === 400);
    return gone ? <Empty>상품을 찾을 수 없습니다. 이미 삭제되었을 수 있습니다.</Empty> : <ErrorState error={query.error} onRetry={() => query.refetch()} />;
  }
  const d = query.data;
  const images = (d.images ?? []).map((ref) => imagePreviewUrl(imageKey(ref)));
  const rows: Array<[string, ReactNode]> = [
    ["상품 코드", d.productCode || "-"],
    ["판매가", formatWon(d.price)],
    ["단가", d.unitPrice != null ? formatWon(d.unitPrice) : "-"],
    ["노출 상태", d.isVisible ? "노출" : "미노출"],
    ["판매 상태", d.onSale ? "판매 중" : "판매 중지"],
    ["카테고리", formatCategoryPath([d.category ?? null, d.subCategory ?? null, d.childCategory ?? null])],
    ["ERP 코드", d.erpCode || "-"],
    ["ERP 상품명", d.erpName || "-"],
    ["수량", d.quantity != null ? d.quantity.toLocaleString("ko-KR") : "-"],
    ["면세 여부", d.taxType === "tax_free" ? "면세" : d.taxType === "tax" ? "과세" : "-"],
    ["ERP 단가", d.erpUnitPrice != null ? formatWon(d.erpUnitPrice) : "-"],
    ["등록일", formatDateTime(d.createdAt)],
  ];

  return (
    <div className={styles.overview}>
      <section aria-labelledby="images-heading">
        <h2 id="images-heading" className={styles["section-title"]}>
          이미지
        </h2>
        {images.length ? (
          <ul className={styles.gallery}>
            {images.map((src, i) => (
              <li key={src} className={styles["gallery-item"]}>
                <Image src={src} alt={`${d.productName} 이미지 ${i + 1}`} fill sizes="160px" className={styles["gallery-img"]} />
              </li>
            ))}
          </ul>
        ) : (
          <p className={styles.muted}>등록된 이미지가 없습니다.</p>
        )}
      </section>

      <section aria-labelledby="info-heading">
        <h2 id="info-heading" className={styles["section-title"]}>
          상품 정보
        </h2>
        <dl className={styles.info}>
          {rows.map(([label, value]) => (
            <div key={label} className={styles["info-row"]}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section aria-labelledby="desc-heading">
        <h2 id="desc-heading" className={styles["section-title"]}>
          상세 설명
        </h2>
        <p className={styles.description}>{d.description?.trim() || "-"}</p>
      </section>
    </div>
  );
}

// ---------- Sessions ----------

function SessionsTab({ productId, page, onPage }: { productId: number; page: number; onPage: (page: number) => void }) {
  const query = useProductSessions(productId, page, true);
  if (query.isPending) return <Loading />;
  if (query.isError) return <ErrorState error={query.error} onRetry={() => query.refetch()} />;
  if (!query.data.rows.length) return <Empty>이 상품과 연결된 수업이 없습니다.</Empty>;

  return (
    <>
      <p className={styles.count}>전체 {query.data.totalRecords.toLocaleString("ko-KR")}건</p>
      <div className={styles["table-wrap"]}>
        <table className={styles.table}>
          <caption className="visually-hidden">이 상품을 사용하는 수업</caption>
          <thead>
            <tr>
              <th scope="col">수업</th>
              <th scope="col">교재 구분</th>
              <th scope="col">사용 여부</th>
              <th scope="col">연결일</th>
            </tr>
          </thead>
          <tbody>
            {query.data.rows.map((row) => (
              <tr key={row.id}>
                <td>{row.session?.title ?? "-"}</td>
                <td>{row.bookType === "MAIN" ? "주교재" : row.bookType === "OPTIONAL" ? "부교재" : (row.bookType ?? "-")}</td>
                <td>{row.isActive ? "사용" : "미사용"}</td>
                <td>{formatDateTime(row.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination page={page} totalPages={query.data.totalPage} onChange={onPage} />
    </>
  );
}

// ---------- Same category ----------

function RelatedTab({
  productId,
  childCategoryId,
  detailState,
  page,
  onPage,
}: {
  productId: number;
  childCategoryId: number | null;
  detailState: "loading" | "error" | "ready";
  page: number;
  onPage: (page: number) => void;
}) {
  const query = useSameCategoryProducts(childCategoryId, page, detailState === "ready");
  if (detailState === "loading") return <Loading />;
  if (detailState === "error") return <Empty>상품 정보를 불러오지 못해 같은 카테고리 상품을 표시할 수 없습니다. 기본 정보 탭을 확인해 주세요.</Empty>;
  if (childCategoryId === null) return <Empty>이 상품에는 카테고리가 없습니다.</Empty>;
  if (query.isPending) return <Loading />;
  if (query.isError) return <ErrorState error={query.error} onRetry={() => query.refetch()} />;

  const rows = query.data.rows.filter((row) => row.id !== productId);
  if (!rows.length) return <Empty>같은 카테고리에 다른 상품이 없습니다.</Empty>;

  return (
    <>
      <p className={styles.count}>같은 소분류의 상품: {Math.max(query.data.totalRecords - 1, rows.length).toLocaleString("ko-KR")}건</p>
      <div className={styles["table-wrap"]}>
        <table className={styles.table}>
          <caption className="visually-hidden">같은 카테고리의 다른 상품</caption>
          <thead>
            <tr>
              <th scope="col">상품명</th>
              <th scope="col">상품 코드</th>
              <th scope="col">판매가</th>
              <th scope="col">노출 여부</th>
              <th scope="col">판매 상태</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>
                  <Link href={`/shopping/products/${row.id}`} className={styles["row-link"]}>
                    {row.productName}
                  </Link>
                </td>
                <td>{row.productCode || "-"}</td>
                <td>{formatWon(row.price)}</td>
                <td>{row.isVisible ? "노출" : "미노출"}</td>
                <td>{row.onSale ? "판매 중" : "판매 중지"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination page={page} totalPages={query.data.totalPage} onChange={onPage} />
    </>
  );
}

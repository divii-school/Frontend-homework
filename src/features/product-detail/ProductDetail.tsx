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
  { key: "overview", label: "Overview" },
  { key: "sessions", label: "Sessions" },
  { key: "related", label: "Same category" },
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
        title={name ?? "Product Details"}
        crumb="Product Details"
        actions={
          <>
            <Link href="/shopping/products" className={`${btn.button} ${btn.outline} ${styles.linkButton}`}>
              Back to list
            </Link>
            {detail.data && (
              <Link href={`/shopping/products/${productId}/edit`} className={`${btn.button} ${btn.primary} ${styles.linkButton}`}>
                Edit
              </Link>
            )}
          </>
        }
      />

      <div className={styles.content}>
        <div className={styles.tablist} role="tablist" aria-label="Product details">
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
              className={`${styles.tab} ${tab === t.key ? styles.tabActive : ""}`}
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

function Loading({ label }: { label: string }) {
  return (
    <div className={styles.state} role="status">
      <span className={styles.spinner} aria-hidden />
      Loading {label}…
    </div>
  );
}

function ErrorState({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  return (
    <div className={styles.state} role="alert">
      <p>{errorMessage(error)}</p>
      <button type="button" className={`${btn.button} ${btn.outline}`} onClick={onRetry}>
        Try again
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
  if (query.isPending) return <Loading label="product" />;
  if (query.isError) {
    const gone = query.error instanceof ApiError && (query.error.status === 404 || query.error.status === 400);
    return gone ? <Empty>This product doesn&apos;t exist or was deleted.</Empty> : <ErrorState error={query.error} onRetry={() => query.refetch()} />;
  }
  const d = query.data;
  const images = (d.images ?? []).map((ref) => imagePreviewUrl(imageKey(ref)));
  const rows: Array<[string, ReactNode]> = [
    ["Product code", d.productCode || "-"],
    ["Selling price", formatWon(d.price)],
    ["Unit price", d.unitPrice != null ? formatWon(d.unitPrice) : "-"],
    ["Exposure status", d.isVisible ? "Yes" : "No"],
    ["Sales status", d.onSale ? "Yes" : "No"],
    ["Category", formatCategoryPath([d.category ?? null, d.subCategory ?? null, d.childCategory ?? null])],
    ["ERP code", d.erpCode || "-"],
    ["Product ERP name", d.erpName || "-"],
    ["Quantity", d.quantity != null ? d.quantity.toLocaleString("en-US") : "-"],
    ["Tax exemption", d.taxType === "tax_free" ? "Tax-free" : d.taxType === "tax" ? "Taxable" : "-"],
    ["ERP unit price", d.erpUnitPrice != null ? formatWon(d.erpUnitPrice) : "-"],
    ["Registration date", formatDateTime(d.createdAt)],
  ];

  return (
    <div className={styles.overview}>
      <section aria-labelledby="images-heading">
        <h2 id="images-heading" className={styles.sectionTitle}>
          Images
        </h2>
        {images.length ? (
          <ul className={styles.gallery}>
            {images.map((src, i) => (
              <li key={src} className={styles.galleryItem}>
                <Image src={src} alt={`${d.productName} image ${i + 1}`} fill sizes="160px" className={styles.galleryImg} />
              </li>
            ))}
          </ul>
        ) : (
          <p className={styles.muted}>No images.</p>
        )}
      </section>

      <section aria-labelledby="info-heading">
        <h2 id="info-heading" className={styles.sectionTitle}>
          Information
        </h2>
        <dl className={styles.info}>
          {rows.map(([label, value]) => (
            <div key={label} className={styles.infoRow}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section aria-labelledby="desc-heading">
        <h2 id="desc-heading" className={styles.sectionTitle}>
          Detailed description
        </h2>
        <p className={styles.description}>{d.description?.trim() || "-"}</p>
      </section>
    </div>
  );
}

// ---------- Sessions ----------

function SessionsTab({ productId, page, onPage }: { productId: number; page: number; onPage: (page: number) => void }) {
  const query = useProductSessions(productId, page, true);
  if (query.isPending) return <Loading label="sessions" />;
  if (query.isError) return <ErrorState error={query.error} onRetry={() => query.refetch()} />;
  if (!query.data.rows.length) return <Empty>This product isn&apos;t linked to any class session yet.</Empty>;

  return (
    <>
      <p className={styles.count}>Total: {query.data.totalRecords.toLocaleString("en-US")}</p>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <caption className="visually-hidden">Class sessions that use this product</caption>
          <thead>
            <tr>
              <th scope="col">Session</th>
              <th scope="col">Book type</th>
              <th scope="col">Active</th>
              <th scope="col">Linked on</th>
            </tr>
          </thead>
          <tbody>
            {query.data.rows.map((row) => (
              <tr key={row.id}>
                <td>{row.session?.title ?? "-"}</td>
                <td>{row.bookType === "MAIN" ? "Main" : row.bookType === "OPTIONAL" ? "Optional" : (row.bookType ?? "-")}</td>
                <td>{row.isActive ? "Yes" : "No"}</td>
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
  if (detailState === "loading") return <Loading label="products" />;
  if (detailState === "error") return <Empty>Product information couldn&apos;t be loaded, so related products can&apos;t be shown. See the Overview tab.</Empty>;
  if (childCategoryId === null) return <Empty>This product has no category.</Empty>;
  if (query.isPending) return <Loading label="products" />;
  if (query.isError) return <ErrorState error={query.error} onRetry={() => query.refetch()} />;

  const rows = query.data.rows.filter((row) => row.id !== productId);
  if (!rows.length) return <Empty>No other products in this category.</Empty>;

  return (
    <>
      <p className={styles.count}>Products in the same minor category: {Math.max(query.data.totalRecords - 1, rows.length).toLocaleString("en-US")}</p>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <caption className="visually-hidden">Other products in the same category</caption>
          <thead>
            <tr>
              <th scope="col">Product name</th>
              <th scope="col">Code</th>
              <th scope="col">Selling price</th>
              <th scope="col">Exposure</th>
              <th scope="col">On sale</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>
                  <Link href={`/shopping/products/${row.id}`} className={styles.rowLink}>
                    {row.productName}
                  </Link>
                </td>
                <td>{row.productCode || "-"}</td>
                <td>{formatWon(row.price)}</td>
                <td>{row.isVisible ? "Yes" : "No"}</td>
                <td>{row.onSale ? "Yes" : "No"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination page={page} totalPages={query.data.totalPage} onChange={onPage} />
    </>
  );
}

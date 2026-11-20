'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { TabView, TabPanel } from 'primereact/tabview';
import { Button } from 'primereact/button';
import { Paginator } from 'primereact/paginator';
import { PageHeader } from '@/components/layout/PageHeader';
import { QueryState } from '@/components/common/QueryState';
import { useCan } from '@/features/auth/AuthProvider';
import { formatDateTime, formatNumber, formatWon } from '@/lib/format';
import { Thumb } from './components/Thumb';
import { useProductDetail, useRelatedProducts } from './useProducts';
import styles from './ProductDetailPage.module.scss';

const TABS = ['info', 'images', 'related'] as const;
type Tab = (typeof TABS)[number];

/** Active tab lives in ?tab= so refresh / shared links open the same tab. */
export function ProductDetailPage({ id }: { id: number }) {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const tabParam = params.get('tab') as Tab | null;
  const active: Tab = tabParam && TABS.includes(tabParam) ? tabParam : 'info';
  const canUpdate = useCan('product.update');

  // Header needs the name; the query is shared with the info tab via cache.
  const header = useProductDetail(id);

  const setTab = (i: number) => {
    const q = new URLSearchParams(params.toString());
    q.set('tab', TABS[i]);
    router.replace(`${pathname}?${q.toString()}`, { scroll: false });
  };

  return (
    <>
      <PageHeader
        title={header.data?.productName || '상품 상세'}
        crumbs={['쇼핑몰 관리', '상품 관리', '상품 상세']}
        actions={
          <>
            <Button label="목록" outlined onClick={() => router.push('/shopping/products')} />
            {canUpdate && <Button label="수정" onClick={() => router.push(`/shopping/products/${id}/edit`)} />}
          </>
        }
      />
      <TabView activeIndex={TABS.indexOf(active)} onTabChange={(e) => setTab(e.index)}>
        <TabPanel header="기본 정보">{active === 'info' && <InfoTab id={id} />}</TabPanel>
        <TabPanel header="이미지">{active === 'images' && <ImagesTab id={id} />}</TabPanel>
        <TabPanel header="같은 카테고리 상품">{active === 'related' && <RelatedTab id={id} />}</TabPanel>
      </TabView>
    </>
  );
}

function InfoTab({ id }: { id: number }) {
  const { data, isLoading, error, refetch } = useProductDetail(id);
  if (isLoading || error || !data) return <QueryState isLoading={isLoading} error={error} isEmpty={!data} onRetry={() => void refetch()} />;
  const rows: [string, string][] = [
    ['상품코드', data.productCode || '-'],
    ['ERP 코드', data.erpCode || '-'],
    ['단가', formatWon(data.unitPrice)],
    ['판매가', formatWon(data.price)],
    ['카테고리', data.categoryPath],
    ['노출 상태', data.isVisible === 'yes' ? 'Yes' : 'No'],
    ['판매 상태', data.onSale === 'yes' ? 'Yes' : 'No'],
    ['ERP 상품명', data.erpName || '-'],
    ['수량', formatNumber(data.quantity)],
    ['과세 구분', data.taxType || '-'],
    ['ERP 단가', formatWon(data.erpUnitPrice)],
    ['등록일', formatDateTime(data.createdAt)],
    ['수정일', formatDateTime(data.updatedAt)],
  ];
  return (
    <div>
      <dl className={styles.dl}>
        {rows.map(([k, v]) => (
          <div key={k} className={styles.dlRow}>
            <dt>{k}</dt>
            <dd>{v}</dd>
          </div>
        ))}
      </dl>
      <h2 className={styles.h2}>상세 설명</h2>
      <p className={styles.desc}>{data.description || '-'}</p>
    </div>
  );
}

function ImagesTab({ id }: { id: number }) {
  const { data, isLoading, error, refetch } = useProductDetail(id);
  const images = data?.images ?? [];
  if (isLoading || error || !images.length)
    return <QueryState isLoading={isLoading} error={error} isEmpty={!images.length} emptyText="등록된 이미지가 없습니다." onRetry={() => void refetch()} />;
  return (
    <ul className={styles.images}>
      {images.map((src, i) => (
        <li key={src}>
          <Thumb src={src} alt={`상품 이미지 ${i + 1}`} size={160} />
        </li>
      ))}
    </ul>
  );
}

function RelatedTab({ id }: { id: number }) {
  const detail = useProductDetail(id);
  const [page, setPage] = useState(1);
  const related = useRelatedProducts(detail.data?.categoryId, page, !!detail.data);
  const items = (related.data?.items ?? []).filter((p) => p.id !== id);
  if (detail.isLoading || related.isLoading || detail.error || related.error || !items.length)
    return (
      <QueryState
        isLoading={detail.isLoading || related.isLoading}
        error={detail.error ?? related.error}
        isEmpty={!items.length}
        emptyText="같은 카테고리의 다른 상품이 없습니다."
        onRetry={() => void related.refetch()}
      />
    );
  return (
    <>
      <ul className={styles.related}>
        {items.map((p) => (
          <li key={p.id}>
            <Thumb src={p.thumbnail} alt={p.name} size={48} />
            <Link href={`/shopping/products/${p.id}`}>{p.name}</Link>
            <span className="muted">{formatWon(p.price)}</span>
          </li>
        ))}
      </ul>
      <Paginator first={(page - 1) * 10} rows={10} totalRecords={related.data?.total ?? 0} onPageChange={(e) => setPage(e.page + 1)} />
    </>
  );
}

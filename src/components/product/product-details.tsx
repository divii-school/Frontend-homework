'use client';

import { useState, type ReactNode } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { Paginator } from 'primereact/paginator';
import { PageHeader } from '@/components/layout/page-header';
import { StateBlock } from '@/components/common/state-block';
import { UrlTabs } from '@/components/common/url-tabs';
import { ROUTES } from '@/config/app-routes';
import { useDeleteProducts, useProductDetails, useProductsInChildCategory } from '@/hooks/api/product/use-products';
import { ApiError } from '@/lib/api/api-error';
import { errorMessage } from '@/lib/api/error-messages';
import { decodeEntities } from '@/lib/text';
import { formatCategoryPath, formatDateTimeSlash, formatNumber, formatPriceSymbol } from '@/lib/format';
import { lastListQuery } from '@/lib/list-memory';
import { useAuth } from '@/providers/auth-provider';
import { useToast } from '@/providers/toast-provider';
import styles from './product-details.module.scss';

/** Shared loading / not found / error handling for a tab that reads the product details. */
function DetailsGate({ id, children }: { id: number; children: (p: NonNullable<ReturnType<typeof useProductDetails>['data']>) => ReactNode }) {
  const details = useProductDetails(id);
  if (details.isLoading) return <StateBlock variant="loading" title="불러오는 중입니다." />;
  if (details.isError || !details.data) {
    const notFound = details.error instanceof ApiError && details.error.kind === 'notFound';
    return (
      <StateBlock
        variant={notFound ? 'not-found' : 'error'}
        title={notFound ? '상품을 찾을 수 없습니다.' : '정보를 불러오지 못했습니다.'}
        description={errorMessage(details.error)}
        action={notFound ? undefined : <Button label="다시 시도" onClick={() => void details.refetch()} />}
      />
    );
  }
  return <>{children(details.data)}</>;
}

function InfoList({ rows }: { rows: Array<[string, ReactNode]> }) {
  return (
    <dl className={styles['info-list']}>
      {rows.map(([term, value]) => (
        <div key={term} className={styles['info-row']}>
          <dt>{term}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  );
}

const yesNo = (value: boolean) => (value ? '예' : '아니오');

/** Tab 1 — 기본 정보. */
function BasicTab({ id }: { id: number }) {
  return (
    <DetailsGate id={id}>
      {(p) => (
        <InfoList
          rows={[
            ['상품코드', p.productCode],
            ['상품명', decodeEntities(p.productName)],
            ['판매가', formatPriceSymbol(p.price)],
            ['단가', formatPriceSymbol(p.unitPrice)],
            ['카테고리', decodeEntities(formatCategoryPath(p.category?.name, p.subCategory?.name, p.childCategory?.name))],
            ['노출 상태', yesNo(p.isVisible)],
            ['판매 상태', yesNo(p.onSale)],
            ['등록일', formatDateTimeSlash(p.createdAt)],
            ['수정일', formatDateTimeSlash(p.updatedAt)],
            ['상세설명', <span key="d" className={styles['pre-line']}>{p.description ? decodeEntities(p.description) : '-'}</span>],
          ]}
        />
      )}
    </DetailsGate>
  );
}

/** Tab 2 — 이미지. */
function ImagesTab({ id }: { id: number }) {
  return (
    <DetailsGate id={id}>
      {(p) =>
        p.images.length === 0 ? (
          <StateBlock variant="empty" title="등록된 이미지가 없습니다." />
        ) : (
          <ul className={styles['image-grid']}>
            {p.images.map((url, index) => (
              <li key={url} className={styles['image-item']}>
                <Image src={url} alt={`상품 이미지 ${index + 1}${index === 0 ? ' (대표)' : ''}`} fill sizes="(max-width: 640px) 50vw, 200px" className={styles['image']} />
                {index === 0 && <span className={styles['image-badge']}>대표</span>}
              </li>
            ))}
          </ul>
        )
      }
    </DetailsGate>
  );
}

/** Tab 3 — ERP 정보. */
function ErpTab({ id }: { id: number }) {
  return (
    <DetailsGate id={id}>
      {(p) => (
        <InfoList
          rows={[
            ['ERP 코드', p.erpCode || '-'],
            ['ERP 상품명', p.erpName ? decodeEntities(p.erpName) : '-'],
            ['수량', `${formatNumber(p.quantity)} 개`],
            ['과세 구분', p.taxType === 'tax_free' ? '비과세' : '과세'],
            ['ERP 단가', formatPriceSymbol(p.erpUnitPrice)],
          ]}
        />
      )}
    </DetailsGate>
  );
}

/** Tab 4 — 같은 카테고리 상품: its own endpoint (GET /products/get-products-by-category). */
function RelatedTab({ id }: { id: number }) {
  return <DetailsGate id={id}>{(p) => <RelatedList productId={p.id} childCategoryId={p.childCategory?.id} />}</DetailsGate>;
}

function RelatedList({ productId, childCategoryId }: { productId: number; childCategoryId?: number }) {
  const [page, setPage] = useState(1);
  const related = useProductsInChildCategory(childCategoryId, page);
  if (!childCategoryId) return <StateBlock variant="empty" title="소분류가 지정되지 않은 상품입니다." />;
  if (related.isLoading) return <StateBlock variant="loading" title="같은 카테고리 상품을 불러오는 중입니다." />;
  if (related.isError || !related.data)
    return (
      <StateBlock
        variant="error"
        title="같은 카테고리 상품을 불러오지 못했습니다."
        description={errorMessage(related.error)}
        action={<Button label="다시 시도" onClick={() => void related.refetch()} />}
      />
    );
  const others = related.data.items.filter((item) => item.id !== productId);
  if (related.data.totalRecords <= 1 && others.length === 0) return <StateBlock variant="empty" title="같은 카테고리에 다른 상품이 없습니다." />;
  return (
    <>
      <p className={styles['related-count']}>
        같은 소분류 상품 <strong>{formatNumber(related.data.totalRecords)}</strong>건 (현재 상품 포함)
      </p>
      <ul className={styles['related-list']}>
        {related.data.items.map((item) => (
          <li key={item.id}>
            <Link href={ROUTES.productDetails(item.id)} className={styles['related-link']} aria-current={item.id === productId ? 'page' : undefined}>
              <span>{decodeEntities(item.productName)}</span>
              <span className={styles['related-meta']}>
                {item.productCode} · {formatPriceSymbol(item.price)}
                {item.id === productId && ' · 현재 상품'}
              </span>
            </Link>
          </li>
        ))}
      </ul>
      {related.data.totalRecords > 10 && (
        <Paginator first={(page - 1) * 10} rows={10} totalRecords={related.data.totalRecords} onPageChange={(e) => setPage(e.page + 1)} />
      )}
    </>
  );
}

/** 상품 상세 with tabs (HW3 requirement; Figma has no details screen, so it follows the 8.1.x style). */
export function ProductDetails({ id }: { id: number }) {
  const router = useRouter();
  const toast = useToast();
  const { can } = useAuth();
  const details = useProductDetails(id);
  const remove = useDeleteProducts();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const canEdit = can('productManagement');
  const name = details.data ? decodeEntities(details.data.productName) : '상품 상세';

  const runDelete = async () => {
    try {
      await remove.mutateAsync([id]);
      toast.show('success', `'${name}' 상품이 삭제되었습니다.`);
      router.push(`${ROUTES.products}${lastListQuery()}`);
    } catch (error) {
      toast.show('error', errorMessage(error));
    }
  };

  return (
    <div className={styles['details-page']}>
      <PageHeader
        title={name}
        breadcrumb={[{ label: '쇼핑몰 관리' }, { label: '상품 관리', href: `${ROUTES.products}${lastListQuery()}` }, { label: '상품 상세' }]}
        actions={
          <>
            <Link href={`${ROUTES.products}${lastListQuery()}`} className="p-button p-component p-button-outlined">
              목록
            </Link>
            {canEdit && details.data && (
              <>
                <Button type="button" label="삭제" outlined severity="danger" onClick={() => setConfirmDelete(true)} />
                <Link href={ROUTES.productEdit(id)} className="p-button p-component">
                  수정
                </Link>
              </>
            )}
          </>
        }
      />
      <section className={styles['panel']}>
        <UrlTabs
          label="상품 상세 정보"
          tabs={[
            { key: 'basic', label: '기본 정보', render: () => <BasicTab id={id} /> },
            { key: 'images', label: '이미지', render: () => <ImagesTab id={id} /> },
            { key: 'erp', label: 'ERP 정보', render: () => <ErpTab id={id} /> },
            { key: 'related', label: '같은 카테고리 상품', render: () => <RelatedTab id={id} /> },
          ]}
        />
      </section>

      <Dialog
        visible={confirmDelete}
        header="상품 삭제"
        onHide={() => !remove.isPending && setConfirmDelete(false)}
        className={styles['dialog']}
        draggable={false}
        footer={
          <div className={styles['dialog-footer']}>
            <Button label="취소" outlined onClick={() => setConfirmDelete(false)} disabled={remove.isPending} />
            <Button label="삭제" severity="danger" onClick={() => void runDelete()} loading={remove.isPending} autoFocus />
          </div>
        }
      >
        <p className={styles['dialog-text']}>
          &apos;{name}&apos; 상품을 삭제하시겠습니까?
          <br />
          삭제한 상품은 되돌릴 수 없습니다.
        </p>
      </Dialog>
    </div>
  );
}

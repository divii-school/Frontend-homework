'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { MENU, findRoute } from '@/config/app-routes';
import { hasPermission } from '@/lib/auth/permissions';
import { useAuth } from '@/providers/auth-provider';
import { MaskIcon } from '@/components/common/mask-icon';
import styles from './app-shell.module.scss';
import { BrandLogo } from '@/components/common/brand-logo';

/**
 * The rest of the Figma admin menu, outside HW3's scope: shown greyed out so the sidebar matches the design
 * (design review 2026-11-18). Plain text marked aria-disabled, never a link or a button.
 */
const OTHER_MENUS_BEFORE = [
  { label: '대시보드', icon: 'pi-th-large' },
  { label: '유저관리', icon: 'pi-users' },
  { label: '학원 관리', icon: 'pi-building' },
  { label: '학사관리', icon: 'pi-book' },
  { label: '교육과정 관리', icon: 'pi-file' },
];
const OTHER_MENUS_AFTER = [
  { label: '공지사항 관리', icon: 'pi-megaphone' },
  { label: '결제 관리', icon: 'pi-credit-card' },
  { label: '지사장 메뉴', icon: 'pi-id-card' },
  { label: '권한 관리', icon: 'pi-key' },
];
const OTHER_SHOP_ITEMS = ['주문 배송 관리', '적립금 관리'];

function OtherMenu({ label, icon }: { label: string; icon: string }) {
  return (
    <li>
      <span className={`${styles['menu-group']} ${styles['is-out-of-scope']}`} aria-disabled="true" title="HW3 과제 범위 밖 메뉴">
        <i className={`pi ${icon} ${styles['other-menu-icon']}`} aria-hidden />
        <span className={styles['menu-group-label']}>{label}</span>
      </span>
    </li>
  );
}

interface SideMenuProps {
  /** Called after a link is chosen, so the mobile drawer can close. */
  onNavigate?: () => void;
  onToggle: () => void;
}

/**
 * Figma "Main menu_admin". Built from MENU in app-routes.ts and filtered by the user's
 * permissions, so a role never sees an entry its route guard would refuse.
 */
export function SideMenu({ onNavigate, onToggle }: SideMenuProps) {
  const pathname = usePathname();
  const { user } = useAuth();
  const activeRoute = findRoute(pathname);
  const groups = MENU.map((group) => ({ ...group, routes: group.routes.filter((r) => hasPermission(user, r.permission)) })).filter(
    (group) => group.routes.length > 0,
  );
  // Groups start open when they hold the current page (the design shows 쇼핑몰 관리 expanded).
  const [open, setOpen] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(MENU.map((g) => [g.label, true])),
  );

  return (
    <nav className={styles['side-menu']} aria-label="관리자 메뉴">
      <div className={styles['side-menu-top']}>
        <Link href="/" className={styles['side-logo']} onClick={onNavigate}>
          <BrandLogo alt="토킹클럽 관리자 홈" priority />
        </Link>
        <button type="button" className={styles['icon-button']} onClick={onToggle} aria-label="메뉴 닫기">
          <MaskIcon src="/icons/icon-bars.svg" size={22} />
        </button>
      </div>

      <ul className={styles['menu-groups']}>
        {OTHER_MENUS_BEFORE.map((m) => (
          <OtherMenu key={m.label} {...m} />
        ))}
        {groups.map((group, groupIndex) => {
          const groupActive = group.routes.some((r) => r.path === activeRoute?.path);
          const expanded = open[group.label] ?? true;
          const listId = `menu-group-${groupIndex}`;
          return (
            <li key={group.label}>
              <button
                type="button"
                className={`${styles['menu-group']} ${groupActive ? styles['is-active'] : ''}`}
                aria-expanded={expanded}
                aria-controls={listId}
                onClick={() => setOpen((s) => ({ ...s, [group.label]: !expanded }))}
              >
                <MaskIcon src={group.icon} size={24} />
                <span className={styles['menu-group-label']}>{group.label}</span>
                <MaskIcon src={expanded ? '/icons/icon-arrow-up.svg' : '/icons/icon-arrow-down.svg'} size={16} />
              </button>
              {expanded && (
                <ul id={listId} className={styles['sub-menu']}>
                  {group.routes.map((route) => {
                    const active = route.path === activeRoute?.path;
                    return (
                      <li key={route.path}>
                        <Link
                          href={route.path}
                          className={`${styles['sub-menu-link']} ${active ? styles['is-active'] : ''}`}
                          aria-current={active ? 'page' : undefined}
                          onClick={onNavigate}
                        >
                          <MaskIcon src="/icons/icon-bullet.svg" size={8} />
                          {route.label}
                        </Link>
                      </li>
                    );
                  })}
                  {group.label === '쇼핑몰 관리' &&
                    OTHER_SHOP_ITEMS.map((label) => (
                      <li key={label}>
                        <span className={`${styles['sub-menu-link']} ${styles['is-out-of-scope']}`} aria-disabled="true" title="HW3 과제 범위 밖 메뉴">
                          <MaskIcon src="/icons/icon-bullet.svg" size={8} />
                          {label}
                        </span>
                      </li>
                    ))}
                </ul>
              )}
            </li>
          );
        })}
        {OTHER_MENUS_AFTER.map((m) => (
          <OtherMenu key={m.label} {...m} />
        ))}
      </ul>
    </nav>
  );
}

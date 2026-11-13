'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { ROUTES } from '@/config/app-routes';
import { useAuth } from '@/providers/auth-provider';
import { useTheme } from '@/providers/theme-provider';
import { MaskIcon } from '@/components/common/mask-icon';
import { SideMenu } from './side-menu';
import styles from './app-shell.module.scss';

/**
 * Admin frame: Figma side menu (230px) + header (54px) + content.
 * Desktop: the ☰ button collapses the menu. Below 991px the menu is a drawer over the page,
 * closed by ☰, the backdrop, Escape, or choosing a link.
 */
export function AppShell({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(true); // desktop: expanded
  const [drawerOpen, setDrawerOpen] = useState(false); // mobile/tablet

  // A new page closes the drawer.
  useEffect(() => setDrawerOpen(false), [pathname]);

  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setDrawerOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [drawerOpen]);

  const toggleMenu = () => {
    if (window.matchMedia('(max-width: 991px)').matches) setDrawerOpen((v) => !v);
    else setMenuOpen((v) => !v);
  };

  return (
    <div className={`${styles['app-shell']} ${menuOpen ? '' : styles['menu-collapsed']} ${drawerOpen ? styles['drawer-open'] : ''}`}>
      <a href="#main-content" className={styles['skip-link']}>
        본문으로 바로가기
      </a>
      <aside className={styles['app-sidebar']}>
        <SideMenu onToggle={toggleMenu} onNavigate={() => setDrawerOpen(false)} />
      </aside>
      {drawerOpen && <div className={styles['drawer-backdrop']} onClick={() => setDrawerOpen(false)} aria-hidden />}

      <div className={styles['app-body']}>
        <header className={styles['app-header']}>
          <button
            type="button"
            className={`${styles['icon-button']} ${styles['header-menu-button']}`}
            onClick={toggleMenu}
            aria-label="메뉴 열기"
            aria-expanded={drawerOpen || menuOpen}
          >
            <MaskIcon src="/icons/icon-bars.svg" size={22} />
          </button>
          <div className={styles['header-actions']}>
            <button
              type="button"
              className={styles['icon-button']}
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? '라이트 모드로 전환' : '다크 모드로 전환'}
              title={theme === 'dark' ? '라이트 모드' : '다크 모드'}
            >
              <i className={`pi ${theme === 'dark' ? 'pi-sun' : 'pi-moon'}`} aria-hidden />
            </button>
            <button type="button" className={styles['icon-button']} onClick={async () => {
                await logout();
                router.replace(ROUTES.login);
              }} aria-label="로그아웃" title="로그아웃">
              <MaskIcon src="/icons/icon-logout.svg" size={18} />
            </button>
            <span className={styles['header-divider']} aria-hidden />
            <span className={styles['header-user']}>{user?.fullName ?? ''}</span>
          </div>
        </header>
        <main id="main-content" className={styles['app-main']} tabIndex={-1}>
          {children}
        </main>
      </div>
    </div>
  );
}

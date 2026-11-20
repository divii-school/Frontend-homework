'use client';

import { useState, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from 'primereact/button';
import { ConfirmDialog } from 'primereact/confirmdialog';
import { visibleMenu } from '@/config/access';
import { useAuth } from '@/features/auth/AuthProvider';
import { useTheme } from '@/components/providers/ThemeProvider';
import styles from './AdminShell.module.scss';

export function AdminShell({ children }: { children: ReactNode }) {
  const { profile, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const menu = visibleMenu(profile?.role);

  return (
    <div className={styles.shell}>
      <ConfirmDialog />
      <aside className={`${styles.sidebar} ${open ? styles.open : ''}`} aria-label="주 메뉴">
        <div className={styles.brand}>
          <span className={styles.logo} aria-hidden="true">
            <i className="pi pi-comments" />
          </span>
          <span>TalkingClub</span>
        </div>
        <nav>
          {menu.map((group) => (
            <div key={group.key} className={styles.group}>
              <div className={styles.groupTitle}>
                {group.icon && <i className={group.icon} aria-hidden="true" />}
                <span>{group.label}</span>
              </div>
              <ul>
                {group.children?.map((item) => {
                  const active = item.match ? pathname.startsWith(item.match) : pathname === item.href;
                  return (
                    <li key={item.key}>
                      <Link
                        href={item.href ?? '#'}
                        className={`${styles.link} ${active ? styles.active : ''}`}
                        aria-current={active ? 'page' : undefined}
                        onClick={() => setOpen(false)}
                      >
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
      </aside>
      {open && <button className={styles.backdrop} aria-label="메뉴 닫기" onClick={() => setOpen(false)} />}

      <div className={styles.main}>
        <header className={styles.header}>
          <Button
            icon="pi pi-bars"
            text
            className={styles.menuBtn}
            aria-label="메뉴 열기"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          />
          <div className={styles.headerRight}>
            <Button
              icon={theme === 'light' ? 'pi pi-moon' : 'pi pi-sun'}
              text
              aria-label={theme === 'light' ? '다크 모드로 전환' : '라이트 모드로 전환'}
              onClick={toggle}
            />
            <Button icon="pi pi-sign-out" text aria-label="로그아웃" onClick={() => void logout()} />
            <span className={styles.user}>{profile?.name}</span>
          </div>
        </header>
        <main id="main" className={styles.content}>
          {children}
        </main>
      </div>
    </div>
  );
}

"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { NAV_GROUP_LABEL, findNavItem, visibleNavItems } from "@/config/navigation";
import { LOGO } from "@/constants/design";
import { ROUTES } from "@/constants/routes";

/** The menu. It draws only the items of config/navigation.ts that this user may open. */
export function Sidebar({ open, onNavigate }: { open: boolean; onNavigate: () => void }) {
  const { user } = useAuth();
  const pathname = usePathname();
  const items = visibleNavItems(user);
  const activeKey = findNavItem(pathname)?.key;

  return (
    <aside className={`app-sidebar${open ? " app-sidebar-open" : ""}`} id="app-sidebar">
      <Link className="app-sidebar-logo" href={ROUTES.home} onClick={onNavigate}>
        <Image src={LOGO.src} alt="TalkingClub" width={LOGO.width} height={LOGO.height} priority />
      </Link>
      <nav aria-label="주 메뉴">
        <p className="app-sidebar-group">
          <i className="pi pi-shopping-bag" aria-hidden="true" />
          {NAV_GROUP_LABEL}
        </p>
        {items.length === 0 ? (
          <p className="app-sidebar-empty">사용할 수 있는 메뉴가 없습니다.</p>
        ) : (
          <ul className="app-sidebar-list">
            {items.map((item) => (
              <li key={item.key}>
                <Link
                  className={`app-sidebar-link${item.key === activeKey ? " app-sidebar-link-active" : ""}`}
                  href={item.path}
                  aria-current={item.key === activeKey ? "page" : undefined}
                  onClick={onNavigate}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </nav>
    </aside>
  );
}

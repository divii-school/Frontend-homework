"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandLogo } from "@/components/common/BrandLogo";
import { useAuth } from "@/components/providers/AuthProvider";
import {
  MENUS_AFTER_SHOPPING,
  MENUS_BEFORE_SHOPPING,
  NAV_GROUP_LABEL,
  OTHER_SHOPPING_PAGES,
  findNavItem,
  visibleNavItems,
  type OutsideMenu,
} from "@/config/navigation";
import { ROUTES } from "@/constants/routes";

/** A menu of the admin that HW3 does not build: drawn greyed out, not a link (Q14). */
function OutsideMenuRow({ menu }: { menu: OutsideMenu }) {
  return (
    <li className="app-sidebar-other" title="HW3 범위가 아닌 메뉴입니다.">
      <i className={`pi ${menu.icon}`} aria-hidden="true" />
      {menu.label}
      <span className="visually-hidden"> (사용할 수 없음)</span>
    </li>
  );
}

/**
 * The menu. It draws only the items of config/navigation.ts that this user may open; the rest of the admin menu of
 * the Figma frames is shown greyed out around them.
 */
export function Sidebar({ open, onNavigate }: { open: boolean; onNavigate: () => void }) {
  const { user } = useAuth();
  const pathname = usePathname();
  const items = visibleNavItems(user);
  const activeKey = findNavItem(pathname)?.key;

  return (
    <aside className={`app-sidebar${open ? " app-sidebar-open" : ""}`} id="app-sidebar">
      {/* The column is as tall as the page; this inner block is the part that stays in view while scrolling. */}
      <div className="app-sidebar-inner">
        <Link className="app-sidebar-logo" href={ROUTES.home} onClick={onNavigate}>
          <BrandLogo />
        </Link>
        <nav aria-label="주 메뉴">
          <ul className="app-sidebar-others">
            {MENUS_BEFORE_SHOPPING.map((menu) => (
              <OutsideMenuRow key={menu.label} menu={menu} />
            ))}
          </ul>
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
              {OTHER_SHOPPING_PAGES.map((label) => (
                <li key={label} className="app-sidebar-link app-sidebar-link-disabled" title="HW3 범위가 아닌 메뉴입니다.">
                  {label}
                  <span className="visually-hidden"> (사용할 수 없음)</span>
                </li>
              ))}
            </ul>
          )}
          <ul className="app-sidebar-others">
            {MENUS_AFTER_SHOPPING.map((menu) => (
              <OutsideMenuRow key={menu.label} menu={menu} />
            ))}
          </ul>
        </nav>
      </div>
    </aside>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "primereact/button";
import { DEFAULT_HOME, matchRoute, visibleMenu, type NavItem } from "@/config/navigation";
import { useSession } from "@/hooks/useSession";
import BrandLogo from "../BrandLogo";

interface AppSidebarProps {
  collapsed: boolean;
  onToggleCollapsed: () => void;
  /** Expands the desktop rail (clicking a group icon while collapsed). */
  onExpand: () => void;
  /** Closes the ≤991px drawer (after a link click / close button). */
  onCloseDrawer: () => void;
}

// Left navigation (design 8.1.0). Built only from visibleMenu(user) in src/config/navigation.ts,
// so a role / permission never sees a link it can't open. Items not in HW3 are greyed and inert.
export default function AppSidebar({ collapsed, onToggleCollapsed, onExpand, onCloseDrawer }: AppSidebarProps) {
  const pathname = usePathname();
  const session = useSession();
  const menu = visibleMenu(session?.user);
  const activeKey = matchRoute(pathname)?.item.key ?? null;

  // Groups start open when they hold the current page; the user can toggle any group
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const isGroupActive = (group: NavItem) => !!group.children?.some((child) => child.key === activeKey);
  const isGroupOpen = (group: NavItem) => openGroups[group.key] ?? isGroupActive(group);

  const toggleGroup = (group: NavItem) => {
    if (collapsed) {
      onExpand();
      setOpenGroups((current) => ({ ...current, [group.key]: true }));
      return;
    }
    setOpenGroups((current) => ({ ...current, [group.key]: !isGroupOpen(group) }));
  };

  return (
    <aside className="app-sidebar" id="app-sidebar" aria-label="Sidebar">
      <div className="app-sidebar-head">
        <BrandLogo href={DEFAULT_HOME} />
        <Button
          type="button"
          icon="pi pi-bars"
          text
          severity="secondary"
          className="app-sidebar-toggle"
          aria-label={collapsed ? "Expand menu" : "Collapse menu"}
          aria-expanded={!collapsed}
          aria-controls="app-sidebar-nav"
          onClick={onToggleCollapsed}
        />
        <Button
          type="button"
          icon="pi pi-times"
          text
          severity="secondary"
          className="app-sidebar-close"
          aria-label="Close menu"
          onClick={onCloseDrawer}
        />
      </div>

      <nav className="app-nav" id="app-sidebar-nav" aria-label="Main menu">
        <ul className="app-nav-list">
          {menu.map((item) => {
            // Not part of HW3: greyed, not focusable, explained for screen readers
            if (item.disabled) {
              return (
                <li key={item.key}>
                  <span className="app-nav-group-button app-nav-disabled" aria-disabled="true" title="Not part of this homework">
                    {item.icon && <i className={`app-nav-icon ${item.icon}`} aria-hidden="true" />}
                    <span className="app-nav-label">{item.label}</span>
                    <span className="sr-only">(not available in this app)</span>
                  </span>
                </li>
              );
            }

            if (item.children) {
              const open = isGroupOpen(item);
              const active = isGroupActive(item);
              const listId = `app-nav-group-${item.key}`;
              return (
                <li key={item.key}>
                  <button
                    type="button"
                    className={active ? "app-nav-group-button app-nav-group-active" : "app-nav-group-button"}
                    aria-expanded={open}
                    aria-controls={listId}
                    title={collapsed ? item.label : undefined}
                    onClick={() => toggleGroup(item)}
                  >
                    {item.icon && <i className={`app-nav-icon ${item.icon}`} aria-hidden="true" />}
                    <span className="app-nav-label">{item.label}</span>
                    <i className={`app-nav-chevron pi ${open ? "pi-chevron-up" : "pi-chevron-down"}`} aria-hidden="true" />
                  </button>
                  {open && (
                    <ul className="app-nav-sublist" id={listId}>
                      {item.children.map((child) =>
                        child.disabled || !child.href ? (
                          <li key={child.key}>
                            <span className="app-nav-sublink app-nav-disabled" aria-disabled="true" title="Not part of this homework">
                              {child.label}
                              <span className="sr-only">(not available in this app)</span>
                            </span>
                          </li>
                        ) : (
                          <li key={child.key}>
                            <Link
                              href={child.href}
                              className={child.key === activeKey ? "app-nav-sublink app-nav-sublink-active" : "app-nav-sublink"}
                              aria-current={child.key === activeKey ? "page" : undefined}
                              onClick={onCloseDrawer}
                            >
                              {child.label}
                            </Link>
                          </li>
                        ),
                      )}
                    </ul>
                  )}
                </li>
              );
            }

            return item.href ? (
              <li key={item.key}>
                <Link
                  href={item.href}
                  className={item.key === activeKey ? "app-nav-group-button app-nav-group-active" : "app-nav-group-button"}
                  aria-current={item.key === activeKey ? "page" : undefined}
                  title={collapsed ? item.label : undefined}
                  onClick={onCloseDrawer}
                >
                  {item.icon && <i className={`app-nav-icon ${item.icon}`} aria-hidden="true" />}
                  <span className="app-nav-label">{item.label}</span>
                </Link>
              </li>
            ) : null;
          })}
        </ul>
      </nav>
    </aside>
  );
}

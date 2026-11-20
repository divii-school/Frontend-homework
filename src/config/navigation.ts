/**
 * ONE config for the sidebar menu, the route guard and permissions.
 * Add a page here and it appears in the menu (for the roles listed) and the guard
 * blocks every other role with the 403 page.
 *
 * Roles: SUPER_ADMIN is confirmed from the QA login. GENERAL_ADMIN follows the Figma notes
 * (Product Management → Super Admin / General Admin; Product Category Management → Super Admin).
 */
import type { ComponentType, SVGProps } from "react";
import { IconCart } from "@/components/icons";
import type { Role } from "@/types/auth";

export interface NavPage {
  label: string;
  href: string;
  roles: readonly Role[];
}

export interface NavGroup {
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  pages: readonly NavPage[];
}

export const NAVIGATION: readonly NavGroup[] = [
  {
    label: "쇼핑몰 관리",
    icon: IconCart,
    pages: [
      { label: "상품 관리", href: "/shopping/products", roles: ["SUPER_ADMIN", "GENERAL_ADMIN"] },
      { label: "상품 카테고리 관리", href: "/shopping/categories", roles: ["SUPER_ADMIN"] },
    ],
  },
];

const ALL_PAGES: readonly NavPage[] = NAVIGATION.flatMap((group) => group.pages);
const ADMIN_ROLES: ReadonlySet<string> = new Set(ALL_PAGES.flatMap((page) => page.roles));

function matches(page: NavPage, pathname: string): boolean {
  return pathname === page.href || pathname.startsWith(`${page.href}/`);
}

/** The config entry for a URL path (longest matching prefix), e.g. /shopping/products/12 → Product Management. */
export function findPage(pathname: string): NavPage | undefined {
  return [...ALL_PAGES].sort((a, b) => b.href.length - a.href.length).find((page) => matches(page, pathname));
}

/** True when the role may use at least one page of the admin. */
export function isAdminRole(role: string): boolean {
  return ADMIN_ROLES.has(role);
}

/** Route guard check. Paths not in the config (e.g. a typo → 404) are left to Next.js. */
export function canAccess(pathname: string, role: string): boolean {
  const page = findPage(pathname);
  return !page || (page.roles as readonly string[]).includes(role);
}

/** The menu for one role: groups with only the pages that role may open. */
export function navigationFor(role: string): NavGroup[] {
  return NAVIGATION.map((group) => ({
    ...group,
    pages: group.pages.filter((page) => (page.roles as readonly string[]).includes(role)),
  })).filter((group) => group.pages.length > 0);
}

/** First page a role may open (where login and "/" send the user). */
export function homeFor(role: string): string | undefined {
  return ALL_PAGES.find((page) => (page.roles as readonly string[]).includes(role))?.href;
}

/** Breadcrumb trail for a path: [group label, page label]. */
export function breadcrumbFor(pathname: string): string[] {
  for (const group of NAVIGATION) {
    const page = group.pages.find((p) => matches(p, pathname));
    if (page) return [group.label, page.label];
  }
  return [];
}

/**
 * ONE config for the sidebar menu, the route guard and permissions.
 * Add a page here and it appears in the menu and is protected with the same roles.
 *
 * Roles come from the Figma descriptions: Product Management → Super Admin / General Admin,
 * Product Category Management → Super Admin.
 * TODO(HW3): map to the real role values from GET /admin/profile once confirmed.
 */
import type { ComponentType, SVGProps } from "react";
import { IconCart } from "@/components/icons";

export type Role = "SUPER_ADMIN" | "GENERAL_ADMIN";

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
    label: "Shopping Mall Management",
    icon: IconCart,
    pages: [
      { label: "Product Management", href: "/shopping/products", roles: ["SUPER_ADMIN", "GENERAL_ADMIN"] },
      { label: "Product Category Management", href: "/shopping/categories", roles: ["SUPER_ADMIN"] },
    ],
  },
];

const ALL_PAGES: readonly NavPage[] = NAVIGATION.flatMap((group) => group.pages);

/** The config entry for a URL path (longest matching prefix), e.g. /shopping/products/12 → Product Management. */
export function findPage(pathname: string): NavPage | undefined {
  return [...ALL_PAGES]
    .sort((a, b) => b.href.length - a.href.length)
    .find((page) => pathname === page.href || pathname.startsWith(`${page.href}/`));
}

/** Breadcrumb trail for a path: [group label, page label]. */
export function breadcrumbFor(pathname: string): string[] {
  for (const group of NAVIGATION) {
    const page = group.pages.find((p) => pathname === p.href || pathname.startsWith(`${p.href}/`));
    if (page) return [group.label, page.label];
  }
  return [];
}

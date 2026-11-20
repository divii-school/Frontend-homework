/**
 * ONE config for menu, route guard and permissions.
 * The sidebar, the route guard (AuthGuard) and every button check (useCan)
 * read from this file only, so they can never get out of sync.
 */
export type Role = 'SUPER_ADMIN' | 'GENERAL_ADMIN' | 'OTHER';

export type Permission =
  | 'product.read'
  | 'product.create'
  | 'product.update'
  | 'product.delete'
  | 'product.export'
  | 'category.read'
  | 'category.write';

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  // Figma 8.2.0 #1: category management is Super Admin only.
  SUPER_ADMIN: [
    'product.read',
    'product.create',
    'product.update',
    'product.delete',
    'product.export',
    'category.read',
    'category.write',
  ],
  // Figma 8.1.0 #1: product management is Super Admin / General Admin.
  GENERAL_ADMIN: ['product.read', 'product.create', 'product.update', 'product.delete', 'product.export'],
  OTHER: [],
};

export interface MenuItem {
  key: string;
  label: string;
  icon?: string;
  href?: string;
  /** Route prefix this item protects. */
  match?: string;
  permission?: Permission;
  children?: MenuItem[];
}

export const MENU: MenuItem[] = [
  {
    key: 'shopping',
    label: '쇼핑몰 관리',
    icon: 'pi pi-shopping-bag',
    children: [
      {
        key: 'products',
        label: '상품 관리',
        href: '/shopping/products',
        match: '/shopping/products',
        permission: 'product.read',
      },
      {
        key: 'categories',
        label: '상품 카테고리 관리',
        href: '/shopping/categories',
        match: '/shopping/categories',
        permission: 'category.read',
      },
    ],
  },
];

/** Extra route rules that are not menu entries (create/edit pages). Most specific first. */
export const ROUTE_RULES: { match: RegExp; permission: Permission }[] = [
  { match: /^\/shopping\/products\/new$/, permission: 'product.create' },
  { match: /^\/shopping\/products\/[^/]+\/edit$/, permission: 'product.update' },
  { match: /^\/shopping\/products(\/.*)?$/, permission: 'product.read' },
  { match: /^\/shopping\/categories(\/.*)?$/, permission: 'category.read' },
];

export const PUBLIC_ROUTES = ['/login', '/403'];

export function can(role: Role | undefined, permission: Permission): boolean {
  if (!role) return false;
  return ROLE_PERMISSIONS[role].includes(permission);
}

export function requiredPermission(pathname: string): Permission | undefined {
  return ROUTE_RULES.find((r) => r.match.test(pathname))?.permission;
}

export function canAccessPath(role: Role | undefined, pathname: string): boolean {
  const perm = requiredPermission(pathname);
  return perm ? can(role, perm) : true;
}

export function visibleMenu(role: Role | undefined): MenuItem[] {
  return MENU.map((group) => ({
    ...group,
    children: group.children?.filter((c) => !c.permission || can(role, c.permission)),
  })).filter((g) => (g.children ? g.children.length > 0 : !g.permission || can(role, g.permission)));
}

/** First page a role may open — used after login when there is no returnTo. */
export function homeFor(role: Role | undefined): string {
  for (const g of visibleMenu(role)) {
    const first = g.children?.[0]?.href ?? g.href;
    if (first) return first;
  }
  return '/403';
}

/** Maps whatever the profile API returns to our Role union. */
export function normalizeRole(raw: string | undefined): Role {
  const v = (raw ?? '').toUpperCase().replace(/[\s-]/g, '_');
  if (!v) return 'OTHER';
  if (v.includes('SUPER')) return 'SUPER_ADMIN';
  if (v === 'ADMIN' || v.includes('GENERAL') || v.includes('SUB_ADMIN')) return 'GENERAL_ADMIN';
  return 'OTHER';
}

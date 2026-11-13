import { describe, expect, it } from 'vitest';
import { allowedRoutes, canOpenPath, hasPermission } from './permissions';
import { findRoute } from '@/config/app-routes';
import type { AuthUser } from '@/types/auth';

const user = (role: string, permissions: AuthUser['permissions']): AuthUser => ({
  id: 1,
  uuid: 'u',
  fullName: '테스트',
  userId: 'tester',
  role,
  permissions,
});

describe('hasPermission', () => {
  it('lets SUPER_ADMIN use everything even with an empty list (as the API returns it)', () => {
    const admin = user('SUPER_ADMIN', []);
    expect(hasPermission(admin, 'productManagement')).toBe(true);
    expect(hasPermission(admin, 'categoryManagement')).toBe(true);
  });

  it('reads { module, subModules } entries', () => {
    const editor = user('ADMIN', [{ module: 'shopping_mall', subModules: ['product_management'] }]);
    expect(hasPermission(editor, 'productManagement')).toBe(true);
    expect(hasPermission(editor, 'categoryManagement')).toBe(false);
  });

  it('reads plain string keys too', () => {
    expect(hasPermission(user('ADMIN', ['category_management']), 'categoryManagement')).toBe(true);
  });

  it('does not accept the right sub-module under another module', () => {
    const other = user('ADMIN', [{ module: 'notice_management', subModules: ['product_management'] }]);
    expect(hasPermission(other, 'productManagement')).toBe(false);
  });

  it('refuses when nobody is logged in', () => {
    expect(hasPermission(null, 'productManagement')).toBe(false);
  });
});

describe('canOpenPath / findRoute (one config for menu and guard)', () => {
  const productsOnly = user('ADMIN', [{ module: 'shopping_mall', subModules: ['product_management'] }]);

  it('matches nested pages to their menu route', () => {
    expect(findRoute('/shopping/products/123/edit')?.path).toBe('/shopping/products');
    expect(findRoute('/shopping/categories')?.path).toBe('/shopping/categories');
  });

  it('does not match a path that only starts with the same letters', () => {
    expect(findRoute('/shopping/productsX')).toBeUndefined();
  });

  it('allows and refuses by the route permission', () => {
    expect(canOpenPath(productsOnly, '/shopping/products/new')).toBe(true);
    expect(canOpenPath(productsOnly, '/shopping/categories')).toBe(false);
  });

  it('refuses a protected URL that is not in the config at all', () => {
    expect(canOpenPath(user('SUPER_ADMIN', []), '/shopping/orders')).toBe(false);
  });

  it('builds the menu from the same permissions', () => {
    expect(allowedRoutes(productsOnly).map((r) => r.path)).toEqual(['/shopping/products']);
    expect(allowedRoutes(user('ADMIN', []))).toEqual([]);
  });
});

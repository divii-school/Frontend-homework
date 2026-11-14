/**
 * Remembers the product list's last query string (page, search), so "목록으로" on the
 * detail and edit pages returns to the same place even after a refresh there.
 * sessionStorage may be unavailable (private mode); then we simply fall back to page 1.
 */
const KEY = 'hw3_product_list_query';

export function rememberListQuery(queryString: string): void {
  try {
    window.sessionStorage.setItem(KEY, queryString);
  } catch {
    // Storage blocked: nothing to remember.
  }
}

export function lastListQuery(): string {
  try {
    return window.sessionStorage.getItem(KEY) ?? '';
  } catch {
    return '';
  }
}

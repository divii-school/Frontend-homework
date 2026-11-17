// Links between the product screens, in one place.
//
// "Back to list" on the details page returns to the exact list the user came from (same page,
// search, filters, sort). The list remembers its own URL in sessionStorage every time it changes;
// the details page reads it. sessionStorage is per browser tab and can be blocked, so every access
// is wrapped in try/catch and falls back to the plain list.

export type ProductDetailsTab = "overview" | "options" | "related";

const LIST_PATH = "/shopping-mall/products";
const LAST_LIST_URL_KEY = "tc-hw3-product-list-url";

export const PRODUCT_ROUTES = {
  list: LIST_PATH,
  create: `${LIST_PATH}/create`,
  edit: (id: number) => `${LIST_PATH}/edit/${id}`,
  details: (id: number, tab?: ProductDetailsTab) => `${LIST_PATH}/details/${id}${tab ? `?tab=${tab}` : ""}`,
} as const;

/** Called by the list whenever its URL changes. */
export function rememberListUrl(url: string): void {
  try {
    window.sessionStorage.setItem(LAST_LIST_URL_KEY, url);
  } catch {
    // storage blocked — "Back to list" just opens the default list
  }
}

/** The last list URL of this tab, or the default list. Only list URLs are accepted. */
export function readListUrl(): string {
  try {
    const saved = window.sessionStorage.getItem(LAST_LIST_URL_KEY);
    if (saved && (saved === LIST_PATH || saved.startsWith(`${LIST_PATH}?`))) return saved;
  } catch {
    // storage blocked
  }
  return LIST_PATH;
}

import { test, expect } from "@playwright/test";
import { MutationObserver } from "@tanstack/react-query";
import { ApiError } from "../src/types/api";
import { createQueryClient, DEFAULT_ERROR_TITLES, SHOWS_OWN_ERROR } from "../src/utils/query-client";

// The default error toast of the app's QueryClient (src/utils/query-client.ts) — no browser, no API.
//
// Why not a browser test: every query / mutation hook of today's screens shows its own error and says so
// with `meta: SHOWS_OWN_ERROR`, so no screen can reach the default toast yet (it is there for the NEXT
// screen that forgets). So the REAL factory and the real TanStack caches run here in Node, with a function
// that records the toasts in place of the PrimeReact Toast. AppProviders passes `useToast().error` instead.
// The other half ("no second toast on screens that show their own error") is checked in the browser:
// products-states.spec.ts (list 500 → 0 toasts, exposure status → exactly 1).
//
// Run alone:  npx playwright test e2e/default-error-toast-states.spec.ts --project=mocked

interface ToastCall {
  summary: string;
  detail: string;
}

/** A fresh app QueryClient whose toasts land in `toasts`. */
function setup() {
  const toasts: ToastCall[] = [];
  const client = createQueryClient((summary, detail) => toasts.push({ summary, detail }));
  return { client, toasts };
}

const notFound = () =>
  new ApiError({ status: 400, kind: "not-found", messageKey: "productNotFound", message: "This product no longer exists." });
const unauthorized = () =>
  new ApiError({ status: 401, kind: "unauthorized", messageKey: "Unauthorized", message: "Your session has expired. Please log in again." });

test.describe("Default error toast (QueryCache / MutationCache)", () => {
  test("a mutation that does not handle its error → one default toast with the error's message", async () => {
    const { client, toasts } = setup();
    const mutation = new MutationObserver(client, { mutationFn: () => Promise.reject(notFound()) });

    await expect(mutation.mutate()).rejects.toThrow("This product no longer exists.");
    expect(toasts).toEqual([{ summary: DEFAULT_ERROR_TITLES.mutation, detail: "This product no longer exists." }]);
  });

  test("a mutation marked SHOWS_OWN_ERROR → no default toast (its screen shows the error)", async () => {
    const { client, toasts } = setup();
    const mutation = new MutationObserver(client, { mutationFn: () => Promise.reject(notFound()), meta: SHOWS_OWN_ERROR });

    await expect(mutation.mutate()).rejects.toThrow();
    expect(toasts).toEqual([]);
  });

  test("a 401 never toasts (the app is already going to the login page)", async () => {
    const { client, toasts } = setup();
    const mutation = new MutationObserver(client, { mutationFn: () => Promise.reject(unauthorized()) });

    await expect(mutation.mutate()).rejects.toThrow();
    await expect(client.fetchQuery({ queryKey: ["e2e", "401"], queryFn: () => Promise.reject(unauthorized()) })).rejects.toThrow();
    expect(toasts).toEqual([]);
  });

  test("a query that is not shown inline → one default toast; marked SHOWS_OWN_ERROR → none", async () => {
    const { client, toasts } = setup();

    await expect(
      client.fetchQuery({ queryKey: ["e2e", "handled"], queryFn: () => Promise.reject(notFound()), meta: SHOWS_OWN_ERROR }),
    ).rejects.toThrow();
    expect(toasts).toEqual([]);

    await expect(client.fetchQuery({ queryKey: ["e2e", "forgotten"], queryFn: () => Promise.reject(notFound()) })).rejects.toThrow();
    expect(toasts).toEqual([{ summary: DEFAULT_ERROR_TITLES.query, detail: "This product no longer exists." }]);
  });

  test("an error that is not an ApiError (a bug in a hook) → the general server message, not the raw error text", async () => {
    const { client, toasts } = setup();
    const mutation = new MutationObserver(client, { mutationFn: () => Promise.reject(new TypeError("x is undefined")) });

    await expect(mutation.mutate()).rejects.toThrow();
    expect(toasts).toEqual([
      { summary: DEFAULT_ERROR_TITLES.mutation, detail: "Something went wrong on the server. Please try again." },
    ]);
  });
});

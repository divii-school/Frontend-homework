import { registerAuthHooks } from "@/services/http";
import { tokenStorage } from "@/lib/auth/tokenStorage";
import { loginUrlFor } from "@/lib/auth/redirect";

function onSessionExpired(): void {
  tokenStorage.clear();
  // Full page load to the login page (also drops all cached data), keeping this page as ?next=
  // so the user comes back to the same place after logging in again.
  const here = `${window.location.pathname}${window.location.search}`;
  // A full load on purpose (not router.push): this runs outside React and must drop every cached query.
  // eslint-disable-next-line @next/next/no-location-assign-relative-destination
  window.location.assign(`${loginUrlFor(here)}&expired=1`);
}

// Registered when this module is first imported (by AuthProvider), before any query runs.
registerAuthHooks({
  getAccessToken: () => tokenStorage.get()?.accessToken ?? null,
  onSessionExpired,
});

import { registerAuthHooks } from "@/services/http";
import { authService } from "@/services/auth";
import { tokenStorage } from "@/lib/auth/tokenStorage";
import { loginUrlFor } from "@/lib/auth/redirect";

// One refresh at a time: parallel 401s all wait for the same promise.
let refreshing: Promise<string | null> | null = null;

function refreshAccessToken(): Promise<string | null> {
  if (!refreshing) {
    const refreshToken = tokenStorage.get()?.refreshToken;
    refreshing = (
      refreshToken
        ? authService.refresh(refreshToken).then((token) => {
            tokenStorage.updateAccessToken(token);
            return token;
          })
        : Promise.resolve(null)
    )
      .catch(() => null)
      .finally(() => {
        refreshing = null;
      });
  }
  return refreshing;
}

function onSessionExpired(): void {
  tokenStorage.clear();
  // Full page load to the login page (also drops all cached data), keeping this page as ?next=.
  const here = `${window.location.pathname}${window.location.search}`;
  window.location.assign(loginUrlFor(here));
}

// Registered when this module is first imported (by AuthProvider), before any query runs.
registerAuthHooks({
  getAccessToken: () => tokenStorage.get()?.accessToken ?? null,
  refreshAccessToken,
  onSessionExpired,
});

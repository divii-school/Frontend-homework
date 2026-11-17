"use client";

import { useMemo, useSyncExternalStore } from "react";
import type { Session } from "@/types/auth";
import { parseSession, readRawSession, subscribeSession } from "@/utils/session";

const noopSubscribe = () => () => {};

/**
 * The current session (token + user) or null. Re-renders on login / logout in this tab and in
 * other tabs. Always null during server render and hydration, so markup never mismatches.
 */
export function useSession(): Session | null {
  const raw = useSyncExternalStore(subscribeSession, readRawSession, () => null);
  return useMemo(() => parseSession(raw), [raw]);
}

/** true once the component runs in the browser (after hydration). */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}

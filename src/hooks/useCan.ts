"use client";

import { canDo, type PermissionAction, type RouteKey } from "@/config/navigation";
import { useSession } from "./useSession";

/**
 * Button-level permission check from the one navigation config.
 *   const canCreate = useCan(ROUTE_KEYS.PRODUCTS, 'create');
 *   {canCreate && <Button label="Register" … />}
 */
export function useCan(routeKey: RouteKey, action: PermissionAction = "read"): boolean {
  const session = useSession();
  return canDo(session?.user, routeKey, action);
}

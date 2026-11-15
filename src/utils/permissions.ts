import type { PermissionGrant } from "@/types/auth";

/** Flatten grants to a set of keys: {module:"shopping_mall", subModules:["product_management"]} gives both keys. */
export function grantedKeys(permissions: Array<PermissionGrant | string>): Set<string> {
  const keys = new Set<string>();
  for (const grant of permissions) {
    if (typeof grant === "string") {
      keys.add(grant);
    } else {
      keys.add(grant.module);
      grant.subModules.forEach((key) => keys.add(key));
    }
  }
  return keys;
}

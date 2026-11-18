/**
 * The QA server is shared by five developers (HW3 rule: create, edit and delete only your own
 * records, named HW3-<name>-...). Reordering rewrites the sort order of EVERY sibling, so it is
 * only allowed when all siblings are this developer's own records.
 */
export const OWN_RECORD_PREFIX = process.env.NEXT_PUBLIC_OWN_RECORD_PREFIX ?? 'HW3-Pranesh-';

export function isOwnRecord(name: string): boolean {
  return name.startsWith(OWN_RECORD_PREFIX);
}

/** True when moving these siblings would only change records this developer created. */
export function canReorderSiblings(names: string[]): boolean {
  return names.length > 1 && names.every(isOwnRecord);
}

import 'server-only';
import { cache } from 'react';
import { one } from './db';
import { CATEGORIES, FINDER_KEEP_DAYS, ID_TYPES, POLICE_DAYS, SHELVES, STORAGE_DAYS } from './constants';
export { SENSITIVE_CATEGORIES, SETTING_LIMITS } from './constants';

/** An organization's rules. Missing values fall back to the defaults in constants.ts. */
export type OrgSettings = {
  storageDays: number;
  /** A finder may keep a found item this many days, then brings it to the office. */
  keepDays: number;
  policeDays: number;
  /** Members don't see these categories in Found items; owners are still told through matching. */
  hideSensitive: boolean;
  categories: string[];
  shelves: string[];
  idTypes: string[];
};

function list(raw: string | null, fallback: string[]): string[] {
  if (!raw) return [...fallback];
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) && v.length ? v.map(String) : [...fallback];
  } catch {
    return [...fallback];
  }
}

/** Cached per request. */
export const getOrgSettings = cache(async (orgId: number): Promise<OrgSettings> => {
  const r = await one<{ storage_days: number; police_days: number; finder_keep_days: number; hide_sensitive: number; categories: string | null; shelves: string | null; id_types: string | null }>(
    'SELECT storage_days, police_days, finder_keep_days, hide_sensitive, categories, shelves, id_types FROM org_settings WHERE organization_id = ?', [orgId]);
  return {
    storageDays: r ? Number(r.storage_days) : STORAGE_DAYS,
    policeDays: r ? Number(r.police_days) : POLICE_DAYS,
    keepDays: r ? Number(r.finder_keep_days) : FINDER_KEEP_DAYS,
    hideSensitive: r ? Boolean(Number(r.hide_sensitive)) : false,
    categories: list(r?.categories ?? null, CATEGORIES),
    shelves: list(r?.shelves ?? null, SHELVES),
    idTypes: list(r?.id_types ?? null, ID_TYPES),
  };
});

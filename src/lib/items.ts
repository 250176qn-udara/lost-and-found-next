import 'server-only';
import type { PoolConnection } from 'mysql2/promise';
import { all, exec, pool } from './db';
import type { Claim, Item, ItemStatus, Kind } from './types';
import { distanceM, NEAR_METERS, num } from './geo';

/** Shapes one items-table row (never includes the photo itself, only whether one exists). */
export function itemRow(r: Record<string, unknown>): Item {
  const row: Item = {
    id: Number(r.id),
    kind: (r.kind as Kind) ?? null,
    title: String(r.title),
    category: String(r.category),
    place: String(r.place),
    lat: num(r.lat),
    lng: num(r.lng),
    date: (r.item_date as string) ?? null,
    description: (r.description as string) ?? null,
    status: Number(r.status) as ItemStatus,
    hasPhoto: Boolean(Number(r.has_photo)),
  };
  if (r.item_code !== undefined) {
    row.itemCode = (r.item_code as string) ?? null;
    row.shelf = (r.shelf as string) ?? null;
    row.receivedAt = (r.received_at as string) ?? null;
    row.handedInAt = (r.handed_in_at as string) ?? null;
    row.createdAt = String(r.created_at);
  }
  if (r.matched_item_id != null) {
    row.matchedItemId = Number(r.matched_item_id);
    row.matchedTitle = (r.matched_title as string) ?? null;
    row.matchedPlace = (r.matched_place as string) ?? null;
    row.matchedDate = (r.matched_date as string) ?? null;
  }
  return row;
}

/** Shapes one claims-table row (joined). */
export function claimRow(r: Record<string, unknown>): Claim {
  return {
    id: Number(r.id),
    itemTitle: String(r.item_title),
    itemPlace: String(r.item_place),
    itemDate: (r.item_date as string) ?? null,
    itemCode: (r.item_code as string) ?? null,
    answers: String(r.answers),
    status: r.status as Claim['status'],
    claimantName: (r.claimant_name as string) ?? null,
    claimantId: r.claimant_id === undefined ? undefined : Number(r.claimant_id),
    claimantEmail: (r.claimant_email as string) ?? null,
    lostDescription: (r.lost_description as string) ?? null,
    createdAt: String(r.created_at),
    foundItemId: r.found_item_id === undefined ? undefined : Number(r.found_item_id),
    foundDescription: r.found_description === undefined ? undefined : ((r.found_description as string) ?? null),
    pickupCode: r.pickup_code === undefined ? undefined : ((r.pickup_code as string) ?? null),
    shelf: r.shelf === undefined ? undefined : ((r.shelf as string) ?? null),
    decidedAt: r.decided_at === undefined ? undefined : ((r.decided_at as string) ?? null),
    ...(r.at_office === undefined ? {} : { atOffice: Boolean(Number(r.at_office)), finderName: (r.finder_name as string) ?? null, handedIn: Boolean(Number(r.handed_in)), hasCode: Boolean(Number(r.has_code)) }),
  };
}

/**
 * Basic rule-based matching (no AI yet): looks for one open item of the opposite kind,
 * in the same organization and category, that shares the place (same name, or map pins within NEAR_METERS) or the date.
 * Picks the closest match — same place AND date first, then same place, then same date.
 */
export async function findMatchFor(orgId: number, kind: Kind, category: string, place: string, date: string | null, excludeId: number,
  pin: { lat: number | null; lng: number | null } = { lat: null, lng: null }): Promise<number | null> {
  const wantKind = kind === 'lost' ? 'found' : 'lost';
  // A lost item matches found items already at the office; a found item matches open lost reports.
  const wantStatus = kind === 'lost' ? [2, 3] : [1];
  const rows = await all<{ id: number; place: string; item_date: string | null; lat: string | null; lng: string | null }>(
    `SELECT id, place, item_date, lat, lng FROM items
     WHERE organization_id = ? AND kind = ? AND category = ? AND matched_item_id IS NULL
           AND status IN (${wantStatus.map(() => '?').join(',')}) AND id <> ?
     ORDER BY id`,
    [orgId, wantKind, category, ...wantStatus, excludeId]);
  let placeMatch: number | null = null;
  let dateMatch: number | null = null;
  for (const r of rows) {
    const near = pin.lat !== null && pin.lng !== null && r.lat !== null && r.lng !== null
      && distanceM({ lat: pin.lat, lng: pin.lng }, { lat: Number(r.lat), lng: Number(r.lng) }) <= NEAR_METERS;
    const samePlace = r.place.toLowerCase() === place.toLowerCase() || near;
    const sameDate = date !== null && r.item_date === date;
    if (samePlace && sameDate) return r.id;
    if (samePlace && placeMatch === null) placeMatch = r.id;
    if (sameDate && dateMatch === null) dateMatch = r.id;
  }
  return placeMatch ?? dateMatch;
}

/** Links two items as a match (status -> Matched, unless already further along) and stamps matched_at. */
export async function applyMatch(itemId: number, matchId: number, db: PoolConnection | typeof pool = pool) {
  await exec('UPDATE items SET matched_item_id = ?, matched_at = NOW(), status = GREATEST(status, 3) WHERE id = ?', [matchId, itemId], db);
}

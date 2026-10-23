import 'server-only';
import type { PoolConnection } from 'mysql2/promise';
import { all, exec, pool } from './db';
import type { Claim, Item, ItemStatus, Kind } from './types';
import { distanceM, NEAR_METERS, num } from './geo';
import { geminiReady, rankMatchesWithGemini, type MatchSide } from './gemini';

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

export type FoundMatch = { id: number; aiScore: number | null; aiReason: string | null };
/** What a match search did: the match (or null), how many items Gemini compared, and whether Gemini was used. */
export type MatchResult = { match: FoundMatch | null; checked: number; ai: boolean };
/** Gemini must be at least this sure before it suggests an item the rules did not find. */
const AI_MIN = 70;

/**
 * Finds the best open item of the opposite kind for a new report. With GEMINI_API_KEY set, Gemini compares the report
 * with up to 8 candidates (same category, or same place) using text and photos. Without a key, or if Gemini fails,
 * the rule-based result below is used.
 */
export async function findMatch(orgId: number, kind: Kind, category: string, place: string, date: string | null, id: number,
  pin: { lat: number | null; lng: number | null } = { lat: null, lng: null }): Promise<MatchResult> {
  const ruleId = await findMatchFor(orgId, kind, category, place, date, id, pin);
  const rulesOnly: MatchResult = { match: ruleId === null ? null : { id: ruleId, aiScore: null, aiReason: null }, checked: 0, ai: false };
  if (!geminiReady()) return rulesOnly;
  try {
    const wantKind = kind === 'lost' ? 'found' : 'lost';
    const wantStatus = kind === 'lost' ? [2, 3] : [1];
    const cols = 'id, title, category, place, item_date, description, photo';
    const me = (await all<Record<string, unknown>>(`SELECT ${cols} FROM items WHERE id = ?`, [id]))[0];
    const rows = await all<Record<string, unknown>>(
      `SELECT ${cols} FROM items
       WHERE organization_id = ? AND kind = ? AND matched_item_id IS NULL AND id <> ?
             AND status IN (${wantStatus.map(() => '?').join(',')}) AND (category = ? OR LOWER(place) = LOWER(?))
             AND created_at > NOW() - INTERVAL 120 DAY
       ORDER BY (id = ?) DESC, (category = ?) DESC, id DESC LIMIT 8`,
      [orgId, wantKind, id, ...wantStatus, category, place, ruleId ?? 0, category]);
    if (!me || !rows.length) return { match: null, checked: 0, ai: true };
    const side = (r: Record<string, unknown>): MatchSide => ({
      id: Number(r.id), title: String(r.title), category: String(r.category), place: String(r.place),
      date: (r.item_date as string) ?? null, description: (r.description as string) ?? null, photo: (r.photo as string) ?? null,
    });
    const ranked = await rankMatchesWithGemini({ ...side(me), kind }, rows.map(side));
    const checked = rows.length;
    const best = ranked[0];
    if (best && best.score >= AI_MIN) return { match: { id: best.id, aiScore: best.score, aiReason: best.reason }, checked, ai: true };
    // Gemini found nothing convincing: keep the rules' pick only if Gemini does not think it is a different item.
    const rule = ranked.find(r => r.id === ruleId);
    if (ruleId !== null && (!rule || rule.score >= 50)) return { match: { id: ruleId, aiScore: rule?.score ?? null, aiReason: rule?.reason ?? null }, checked, ai: true };
    return { match: null, checked, ai: true };
  } catch (e) {
    console.error('[gemini] matching failed, using the rules', e);
    return rulesOnly;
  }
}

/**
 * Basic rule-based matching: looks for one open item of the opposite kind,
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
export async function applyMatch(itemId: number, matchId: number, db: PoolConnection | typeof pool = pool,
  ai: { score: number | null; reason: string | null } = { score: null, reason: null }) {
  await exec('UPDATE items SET matched_item_id = ?, matched_at = NOW(), status = GREATEST(status, 3), ai_score = ?, ai_reason = ? WHERE id = ?',
    [matchId, ai.score, ai.reason, itemId], db);
}

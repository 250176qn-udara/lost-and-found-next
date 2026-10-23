import 'server-only';
import { all, one } from './db';
import { BADGES, SENSITIVE_CATEGORIES, type BadgeKey } from './constants';
import { levelOf } from './points';
import { buildingOf } from './places';

// "Have you seen this?" alerts, sightings, the thank-you wall, Helper of the month and badges.

const s = (v: unknown) => (v == null ? null : String(v));

// ---------- "Have you seen this?" ----------

export type HelpWanted = { id: number; title: string; category: string; place: string; building: string; date: string | null;
  createdAt: string; hasPhoto: boolean; iSaw: boolean };

/** Open lost reports in the community (not the viewer's own). Only the name, category, place and date are shared. */
export async function getHelpWanted(orgId: number, uid: number): Promise<HelpWanted[]> {
  const rows = await all<Record<string, unknown>>(
    `SELECT i.id, i.title, i.category, i.place, i.item_date, i.created_at, (i.photo IS NOT NULL) AS has_photo,
            EXISTS(SELECT 1 FROM sightings g WHERE g.item_id = i.id AND g.user_id = ?) AS i_saw
     FROM items i
     WHERE i.organization_id = ? AND i.kind = 'lost' AND i.status BETWEEN 1 AND 3 AND i.reporter_id <> ?
     ORDER BY i.id DESC`, [uid, orgId, uid]);
  return rows.map(r => ({ id: Number(r.id), title: String(r.title), category: String(r.category), place: String(r.place),
    building: buildingOf(String(r.place)), date: s(r.item_date), createdAt: String(r.created_at),
    hasPhoto: Boolean(Number(r.has_photo)), iSaw: Boolean(Number(r.i_saw)) }));
}

export type Sighting = { id: number; itemId: number; note: string; at: string };

/** What others said about the owner's lost items (never who said it). */
export async function getSightings(itemIds: number[]): Promise<Record<number, Sighting[]>> {
  if (!itemIds.length) return {};
  const rows = await all<{ id: number; item_id: number; note: string; created_at: string }>(
    `SELECT id, item_id, note, created_at FROM sightings WHERE item_id IN (${itemIds.map(() => '?').join(',')}) ORDER BY id DESC`, itemIds);
  const out: Record<number, Sighting[]> = {};
  for (const r of rows) (out[r.item_id] ??= []).push({ id: Number(r.id), itemId: Number(r.item_id), note: String(r.note), at: String(r.created_at) });
  return out;
}

// ---------- Helper of the month ----------

/** "2026-10" for the month before the given date (Japan time). */
export function lastMonth(d = new Date()): string {
  const jst = new Date(d.getTime() + 9 * 3600_000);
  const y = jst.getUTCFullYear(), m = jst.getUTCMonth(); // m = this month (0-based) -> last month is m
  return m === 0 ? `${y - 1}-12` : `${y}-${String(m).padStart(2, '0')}`;
}

/** The member with the most points in a month (ties: who got there first). Respects the ranking opt-out. */
export async function helperOfMonth(orgId: number, ym: string) {
  if (!/^\d{4}-\d{2}$/.test(ym)) return null;
  const r = await one<{ user_id: number; name: string; total: number; returns: number }>(
    `SELECT p.user_id, u.name, SUM(p.points) AS total, SUM(p.reason = 'returned') AS returns
     FROM points p JOIN users u ON u.id = p.user_id AND u.deleted_at IS NULL
     LEFT JOIN user_prefs up ON up.user_id = p.user_id
     WHERE p.organization_id = ? AND DATE_FORMAT(p.created_at, '%Y-%m') = ? AND COALESCE(up.show_in_ranking, 1) = 1
     GROUP BY p.user_id, u.name ORDER BY total DESC, MIN(p.id) ASC LIMIT 1`, [orgId, ym]);
  return r ? { userId: Number(r.user_id), name: String(r.name), total: Number(r.total), returns: Number(r.returns), month: ym } : null;
}

/** Months (before this one) in which this person was Helper of the month. */
async function monthsWon(orgId: number, uid: number): Promise<string[]> {
  const rows = await all<{ ym: string; user_id: number }>(
    `SELECT ym, user_id FROM (
       SELECT DATE_FORMAT(p.created_at, '%Y-%m') AS ym, p.user_id,
              ROW_NUMBER() OVER (PARTITION BY DATE_FORMAT(p.created_at, '%Y-%m') ORDER BY SUM(p.points) DESC, MIN(p.id) ASC) AS rn
       FROM points p LEFT JOIN user_prefs up ON up.user_id = p.user_id
       WHERE p.organization_id = ? AND COALESCE(up.show_in_ranking, 1) = 1
         AND p.created_at < DATE_FORMAT(NOW(), '%Y-%m-01')
       GROUP BY ym, p.user_id) x
     WHERE rn = 1 AND user_id = ?`, [orgId, uid]);
  return rows.map(r => r.ym);
}

// ---------- badges ----------

export type Badge = { key: BadgeKey; icon: string; name: string; desc: string; earned: boolean };

export async function getBadges(uid: number, orgId: number): Promise<Badge[]> {
  const sens = SENSITIVE_CATEGORIES.map(() => '?').join(',');
  const [c, won] = await Promise.all([
    one<Record<string, unknown>>(
      `SELECT
         (SELECT COUNT(*) FROM items WHERE organization_id = ? AND reporter_id = ? AND kind = 'found') AS finds,
         (SELECT COUNT(*) FROM claims c JOIN items i ON i.id = c.found_item_id
            WHERE i.organization_id = ? AND i.reporter_id = ? AND c.status = 'returned' AND c.claimant_id <> ?) AS returns,
         (SELECT COUNT(*) FROM claims c JOIN items i ON i.id = c.found_item_id
            WHERE i.organization_id = ? AND i.reporter_id = ? AND c.status = 'returned' AND c.claimant_id <> ? AND i.category IN (${sens})) AS lifesaves,
         (SELECT COUNT(*) FROM points WHERE organization_id = ? AND user_id = ? AND reason = 'on_time') AS on_time,
         (SELECT COUNT(*) FROM sightings g JOIN items i ON i.id = g.item_id WHERE i.organization_id = ? AND g.user_id = ?) AS sightings,
         (SELECT COUNT(*) FROM thanks t JOIN claims c ON c.id = t.claim_id JOIN items i ON i.id = c.found_item_id
            WHERE i.organization_id = ? AND t.from_user = ?) AS letters`,
      [orgId, uid, orgId, uid, uid, orgId, uid, uid, ...SENSITIVE_CATEGORIES, orgId, uid, orgId, uid, orgId, uid]),
    monthsWon(orgId, uid),
  ]);
  const n = (k: string) => Number(c?.[k] ?? 0);
  const earned: Record<BadgeKey, boolean> = {
    first_find: n('finds') >= 1, first_return: n('returns') >= 1, five_returns: n('returns') >= 5, on_time: n('on_time') >= 3,
    lifesaver: n('lifesaves') >= 1, sharp_eyes: n('sightings') >= 1, grateful: n('letters') >= 1, helper_month: won.length > 0,
  };
  return BADGES.map(b => ({ ...b, earned: earned[b.key] }));
}

// ---------- thank-you wall ----------

export type WallStory = { id: number; category: string; building: string; at: string; finderLevel: { name: string; icon: string };
  points: number; claps: number; clapped: boolean; mine: boolean };

/** Returns whose owner allowed a story on the wall. No names, no letter text: only what was returned, where and when. */
export async function getWall(orgId: number, uid: number, limit = 40): Promise<WallStory[]> {
  const rows = await all<Record<string, unknown>>(
    `SELECT t.id, t.points, t.created_at, i.category, i.place, t.from_user, t.to_user,
            (SELECT COALESCE(SUM(p.points), 0) FROM points p WHERE p.user_id = t.to_user AND p.organization_id = ?) AS finder_points,
            (SELECT COUNT(*) FROM wall_claps w WHERE w.thanks_id = t.id) AS claps,
            EXISTS(SELECT 1 FROM wall_claps w WHERE w.thanks_id = t.id AND w.user_id = ?) AS clapped
     FROM thanks t JOIN claims c ON c.id = t.claim_id JOIN items i ON i.id = c.found_item_id
     WHERE i.organization_id = ? AND t.on_wall = 1
     ORDER BY t.id DESC LIMIT ?`, [orgId, uid, orgId, limit]);
  return rows.map(r => ({
    id: Number(r.id), category: String(r.category), building: buildingOf(String(r.place)), at: String(r.created_at),
    finderLevel: levelOf(Number(r.finder_points)).level, points: Number(r.points), claps: Number(r.claps), clapped: Boolean(Number(r.clapped)),
    mine: Number(r.from_user) === uid || Number(r.to_user) === uid,
  }));
}

/** Items that went back to their owners this month (the database runs on Japan time, like the rest of the app). */
export async function returnedThisMonth(orgId: number): Promise<number> {
  const r = await one<{ n: number }>(
    `SELECT COUNT(*) AS n FROM claims c JOIN items i ON i.id = c.found_item_id
     WHERE i.organization_id = ? AND c.status = 'returned'
       AND c.returned_at >= DATE_FORMAT(NOW(), '%Y-%m-01')`, [orgId]);
  return Number(r?.n ?? 0);
}

import 'server-only';
import type { PoolConnection } from 'mysql2/promise';
import { all, exec, one, pool } from './db';
import { POINT_LEVELS, POINT_RULES, type PointReason } from './constants';

// Thank-you points: a way to recognise people who help. They cannot be bought, sold or exchanged for money or goods
// (so they are not a prepaid payment instrument under Japan's Payment Services Act). Points are only given when staff
// confirm a real step, so nobody can award themselves. One row per person, reason and item: never counted twice.

/** Gives points once per person, reason and item. Only members earn points (not staff doing their job). */
export async function award(orgId: number, uid: number, reason: PointReason, itemId: number, points: number = POINT_RULES[reason],
  db: PoolConnection | typeof pool = pool) {
  if (points <= 0) return;
  const member = await one(`SELECT id FROM organization_members WHERE user_id = ? AND organization_id = ? AND status = 'approved' AND role = 'member'`, [uid, orgId], db);
  if (!member) return;
  await exec('INSERT IGNORE INTO points (organization_id, user_id, points, reason, item_id) VALUES (?, ?, ?, ?, ?)', [orgId, uid, points, reason, itemId], db);
}

export type PointsSummary = {
  total: number;
  level: { name: string; min: number; icon: string };
  next: { name: string; min: number } | null;
  /** 0-100 towards the next level. */
  progress: number;
  history: { points: number; reason: PointReason; item: string | null; at: string }[];
};

export function levelOf(total: number) {
  let i = 0;
  while (i + 1 < POINT_LEVELS.length && total >= POINT_LEVELS[i + 1].min) i++;
  const level = POINT_LEVELS[i], next = POINT_LEVELS[i + 1] ?? null;
  const progress = next ? Math.round(((total - level.min) / (next.min - level.min)) * 100) : 100;
  return { level, next, progress };
}

export async function getPoints(uid: number, orgId: number): Promise<PointsSummary> {
  const [sum, history] = await Promise.all([
    one<{ total: number | null }>('SELECT SUM(points) AS total FROM points WHERE user_id = ? AND organization_id = ?', [uid, orgId]),
    all<{ points: number; reason: PointReason; item: string | null; created_at: string }>(
      `SELECT p.points, p.reason, i.title AS item, p.created_at FROM points p LEFT JOIN items i ON i.id = p.item_id
       WHERE p.user_id = ? AND p.organization_id = ? ORDER BY p.id DESC LIMIT 30`, [uid, orgId]),
  ]);
  const total = Number(sum?.total ?? 0);
  return { total, ...levelOf(total), history: history.map(h => ({ points: Number(h.points), reason: h.reason, item: h.item, at: String(h.created_at) })) };
}

/** Top helpers of the organization (members who did not opt out under Account → Privacy). */
export async function getRanking(orgId: number, limit = 5) {
  const rows = await all<{ user_id: number; name: string; total: number }>(
    `SELECT p.user_id, u.name, SUM(p.points) AS total FROM points p
     JOIN users u ON u.id = p.user_id AND u.deleted_at IS NULL
     LEFT JOIN user_prefs up ON up.user_id = p.user_id
     WHERE p.organization_id = ? AND COALESCE(up.show_in_ranking, 1) = 1
     GROUP BY p.user_id, u.name ORDER BY total DESC, MIN(p.id) ASC LIMIT ?`, [orgId, limit]);
  return rows.map(r => ({ userId: Number(r.user_id), name: String(r.name), total: Number(r.total), level: levelOf(Number(r.total)).level }));
}

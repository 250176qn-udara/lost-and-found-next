import 'server-only';
import { all, one } from './db';
import { POLICE_DAYS, STORAGE_DAYS } from './constants';
import type { AuditRow } from './types';

// Numbers for the admin and super-admin screens. Callers check access first with requirePage().

const num = (v: unknown) => Number(v ?? 0);
export const pct = (part: number, whole: number) => (whole ? Math.round((part / whole) * 100) : 0);

export const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
/** "2026-09" -> "Sep" */
export const monthName = (ym: string) => MONTHS[Number(ym.slice(5, 7)) - 1] ?? ym;

/** The last n months as "YYYY-MM", oldest first. */
function lastMonths(n: number): string[] {
  const d = new Date();
  return Array.from({ length: n }, (_, i) => {
    const x = new Date(d.getFullYear(), d.getMonth() - (n - 1 - i), 1);
    return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}`;
  });
}

export async function getDashboard(orgId: number) {
  const [totals, avg, perMonth, cats] = await Promise.all([
    one<Record<string, unknown>>(
      `SELECT COUNT(*) AS total,
              SUM(kind = 'found' AND status >= 2) AS received,
              SUM(kind = 'found' AND status = 5) AS returned,
              SUM(kind = 'found' AND status BETWEEN 2 AND 4) AS waiting
       FROM items WHERE organization_id = ?`, [orgId]),
    one<{ d: string | null }>(
      `SELECT AVG(TIMESTAMPDIFF(HOUR, i.received_at, c.returned_at)) / 24 AS d
       FROM claims c JOIN items i ON i.id = c.found_item_id
       WHERE i.organization_id = ? AND c.status = 'returned' AND i.received_at IS NOT NULL`, [orgId]),
    all<{ m: string; n: number }>(
      `SELECT DATE_FORMAT(c.returned_at, '%Y-%m') AS m, COUNT(*) AS n
       FROM claims c JOIN items i ON i.id = c.found_item_id
       WHERE i.organization_id = ? AND c.status = 'returned' AND c.returned_at >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
       GROUP BY m`, [orgId]),
    all<{ category: string; n: number }>(
      'SELECT category, COUNT(*) AS n FROM items WHERE organization_id = ? GROUP BY category ORDER BY n DESC', [orgId]),
  ]);
  const byMonth = new Map(perMonth.map(r => [r.m, num(r.n)]));
  return {
    total: num(totals?.total),
    returnRate: pct(num(totals?.returned), num(totals?.received)),
    avgDays: avg?.d === null || avg?.d === undefined ? null : Math.round(Number(avg.d) * 10) / 10,
    waiting: num(totals?.waiting),
    returnsPerMonth: lastMonths(6).map(m => [monthName(m), byMonth.get(m) ?? 0] as [string, number]),
    byCategory: cats.map(c => [c.category, num(c.n)] as [string, number]),
  };
}

/** Numbers on the member's home page. */
export async function getCommunityStats(orgId: number, uid: number) {
  const r = await one<Record<string, unknown>>(
    `SELECT
       (SELECT COUNT(*) FROM claims c JOIN items i ON i.id = c.found_item_id
          WHERE i.organization_id = ? AND c.status = 'returned' AND DATE_FORMAT(c.returned_at, '%Y-%m') = DATE_FORMAT(NOW(), '%Y-%m')) AS month,
       (SELECT COUNT(*) FROM items WHERE organization_id = ? AND kind = 'found' AND status >= 2) AS received,
       (SELECT COUNT(*) FROM items WHERE organization_id = ? AND kind = 'found' AND status = 5) AS returned,
       (SELECT COUNT(*) FROM items WHERE organization_id = ? AND kind = 'found' AND status = 5 AND reporter_id = ?) AS helped`,
    [orgId, orgId, orgId, orgId, uid]);
  return { month: num(r?.month), rate: pct(num(r?.returned), num(r?.received)), helped: num(r?.helped) };
}

/** Counts behind the alert list. */
export async function getAlertCounts(orgId: number) {
  const r = await one<Record<string, unknown>>(
    `SELECT
       (SELECT COUNT(*) FROM items WHERE organization_id = ? AND kind = 'found' AND received_at IS NULL AND status < 5
          AND created_at < NOW() - INTERVAL 3 DAY) AS old_queue,
       (SELECT COUNT(*) FROM claims c JOIN items i ON i.id = c.found_item_id
          WHERE i.organization_id = ? AND c.status = 'pending' AND c.created_at < NOW() - INTERVAL 2 DAY) AS old_claims,
       (SELECT COUNT(*) FROM claims c JOIN items i ON i.id = c.found_item_id
          WHERE i.organization_id = ? AND c.status = 'approved') AS handovers,
       (SELECT COUNT(*) FROM items WHERE organization_id = ? AND kind = 'found' AND status BETWEEN 2 AND 4
          AND DATEDIFF(NOW(), received_at) >= ?) AS expiring,
       (SELECT COUNT(*) FROM organization_members WHERE organization_id = ? AND status = 'pending') AS requests,
       (SELECT COUNT(*) FROM items WHERE organization_id = ? AND kind = 'found' AND status BETWEEN 2 AND 4
          AND received_at IS NOT NULL AND DATEDIFF(NOW(), received_at) >= ?) AS police_late,
       (SELECT COUNT(*) FROM claims c JOIN items i ON i.id = c.found_item_id
          WHERE i.organization_id = ? AND c.status = 'pending') AS pending_claims`,
    [orgId, orgId, orgId, orgId, STORAGE_DAYS - 14, orgId, orgId, POLICE_DAYS, orgId]);
  return {
    oldQueue: num(r?.old_queue), oldClaims: num(r?.old_claims), handovers: num(r?.handovers),
    expiring: num(r?.expiring), requests: num(r?.requests), policeLate: num(r?.police_late), pendingClaims: num(r?.pending_claims),
  };
}

/** Months that have any item, newest first ("YYYY-MM"). */
export async function getReportMonths(orgId: number): Promise<string[]> {
  const rows = await all<{ m: string }>(
    `SELECT DISTINCT DATE_FORMAT(created_at, '%Y-%m') AS m FROM items WHERE organization_id = ? ORDER BY m DESC`, [orgId]);
  return rows.map(r => r.m);
}

/** One month: lost reports, found items, returns, and the same per category. */
export async function getMonthReport(orgId: number, month: string) {
  const [cats, returns] = await Promise.all([
    all<{ category: string; lost: number; found: number; returned: number }>(
      `SELECT category, SUM(kind = 'lost') AS lost, SUM(kind = 'found') AS found, SUM(kind = 'found' AND status = 5) AS returned
       FROM items WHERE organization_id = ? AND DATE_FORMAT(created_at, '%Y-%m') = ?
       GROUP BY category ORDER BY found DESC, lost DESC`, [orgId, month]),
    one<{ n: number }>(
      `SELECT COUNT(*) AS n FROM claims c JOIN items i ON i.id = c.found_item_id
       WHERE i.organization_id = ? AND c.status = 'returned' AND DATE_FORMAT(c.returned_at, '%Y-%m') = ?`, [orgId, month]),
  ]);
  const rows = cats.map(c => ({ category: c.category, lost: num(c.lost), found: num(c.found), returned: num(c.returned) }));
  const found = rows.reduce((a, r) => a + r.found, 0);
  const returnedOfFound = rows.reduce((a, r) => a + r.returned, 0);
  return {
    lost: rows.reduce((a, r) => a + r.lost, 0),
    found,
    returned: num(returns?.n),
    rate: pct(returnedOfFound, found),
    rows,
  };
}

/** Reports per place, and per time of day the report was made. */
export async function getHotspots(orgId: number) {
  const [places, hours] = await Promise.all([
    all<{ place: string; n: number }>(
      'SELECT place, COUNT(*) AS n FROM items WHERE organization_id = ? GROUP BY place ORDER BY n DESC', [orgId]),
    all<{ h: number; n: number }>(
      'SELECT HOUR(created_at) AS h, COUNT(*) AS n FROM items WHERE organization_id = ? GROUP BY h', [orgId]),
  ]);
  const slots: [string, number, number][] = [['0-8', 0, 8], ['8-10', 8, 10], ['10-12', 10, 12], ['12-14', 12, 14], ['14-16', 14, 16], ['16-18', 16, 18], ['18-24', 18, 24]];
  return {
    places: places.map(p => [p.place, num(p.n)] as [string, number]),
    hours: slots.map(([l, from, to]) => [l, hours.filter(h => h.h >= from && h.h < to).reduce((a, h) => a + num(h.n), 0)] as [string, number]),
  };
}

export type StaffActivity = { name: string; role: string; received: number; verified: number; returned: number };

export async function getStaffActivity(orgId: number): Promise<StaffActivity[]> {
  const rows = await all<Record<string, unknown>>(
    `SELECT u.name, m.role,
            (SELECT COUNT(*) FROM items i WHERE i.received_by = u.id AND i.organization_id = m.organization_id) AS received,
            (SELECT COUNT(*) FROM claims c JOIN items i ON i.id = c.found_item_id
               WHERE c.decided_by = u.id AND i.organization_id = m.organization_id) AS verified,
            (SELECT COUNT(*) FROM claims c JOIN items i ON i.id = c.found_item_id
               WHERE c.returned_by = u.id AND i.organization_id = m.organization_id) AS returned
     FROM organization_members m JOIN users u ON u.id = m.user_id
     WHERE m.organization_id = ? AND m.status = 'approved' AND m.role IN ('staff', 'admin')
     ORDER BY u.name`, [orgId]);
  return rows.map(r => ({ name: String(r.name), role: String(r.role), received: num(r.received), verified: num(r.verified), returned: num(r.returned) }));
}

/**
 * Audit log built from the timestamps the tables already keep (who reported, received, decided, handed over,
 * approved). orgId null = every organization (super admin). Logins are not recorded yet.
 */
export async function getAuditLog(orgId: number | null, limit = 200): Promise<AuditRow[]> {
  const w = (col: string) => (orgId === null ? '' : `AND ${col} = ?`);
  const parts = [
    `SELECT i.created_at AS at, 'Items' AS area, IF(i.kind = 'lost', 'Lost item reported', 'Found item reported') AS action,
            u.name AS who, i.title AS target, o.name AS org
     FROM items i JOIN users u ON u.id = i.reporter_id JOIN organizations o ON o.id = i.organization_id
     WHERE 1 ${w('i.organization_id')}`,
    `SELECT i.handed_in_at, 'Items', 'Finder handed it to the office', u.name, i.title, o.name
     FROM items i JOIN users u ON u.id = i.reporter_id JOIN organizations o ON o.id = i.organization_id
     WHERE i.handed_in_at IS NOT NULL ${w('i.organization_id')}`,
    `SELECT i.received_at, 'Items', 'Item received at office', u.name, i.title, o.name
     FROM items i LEFT JOIN users u ON u.id = i.received_by JOIN organizations o ON o.id = i.organization_id
     WHERE i.received_at IS NOT NULL ${w('i.organization_id')}`,
    `SELECT c.created_at, 'Claims', 'Claim sent', u.name, i.title, o.name
     FROM claims c JOIN items i ON i.id = c.found_item_id JOIN users u ON u.id = c.claimant_id JOIN organizations o ON o.id = i.organization_id
     WHERE 1 ${w('i.organization_id')}`,
    `SELECT c.decided_at, 'Claims', IF(c.status = 'rejected', 'Claim rejected', 'Claim approved'), u.name, i.title, o.name
     FROM claims c JOIN items i ON i.id = c.found_item_id LEFT JOIN users u ON u.id = c.decided_by JOIN organizations o ON o.id = i.organization_id
     WHERE c.decided_at IS NOT NULL ${w('i.organization_id')}`,
    `SELECT c.returned_at, 'Claims', 'Item handed over', u.name, i.title, o.name
     FROM claims c JOIN items i ON i.id = c.found_item_id LEFT JOIN users u ON u.id = c.returned_by JOIN organizations o ON o.id = i.organization_id
     WHERE c.returned_at IS NOT NULL ${w('i.organization_id')}`,
    `SELECT m.requested_at, 'Membership', 'Membership requested', u.name, u.name, o.name
     FROM organization_members m JOIN users u ON u.id = m.user_id JOIN organizations o ON o.id = m.organization_id
     WHERE 1 ${w('m.organization_id')}`,
    `SELECT m.approved_at, 'Membership', 'Membership approved', a.name, u.name, o.name
     FROM organization_members m JOIN users u ON u.id = m.user_id LEFT JOIN users a ON a.id = m.approved_by
     JOIN organizations o ON o.id = m.organization_id
     WHERE m.approved_by IS NOT NULL ${w('m.organization_id')}`,
  ];
  const params = orgId === null ? [] : parts.map(() => orgId);
  const rows = await all<Record<string, unknown>>(
    `SELECT * FROM (${parts.join(' UNION ALL ')}) x ORDER BY at DESC LIMIT ${Math.max(1, Math.floor(limit))}`, params);
  return rows.map(r => ({
    at: String(r.at), area: r.area as AuditRow['area'], action: String(r.action),
    who: r.who === null ? null : String(r.who), target: String(r.target), org: String(r.org),
  }));
}

export type OrgStats = { id: number; name: string; type: string; users: number; items: number; rate: number };

export async function getPlatformStats(): Promise<OrgStats[]> {
  const rows = await all<Record<string, unknown>>(
    `SELECT o.id, o.name, o.type,
            (SELECT COUNT(*) FROM organization_members m WHERE m.organization_id = o.id AND m.status = 'approved') AS users,
            (SELECT COUNT(*) FROM items i WHERE i.organization_id = o.id) AS items,
            (SELECT COUNT(*) FROM items i WHERE i.organization_id = o.id AND i.kind = 'found' AND i.status >= 2) AS received,
            (SELECT COUNT(*) FROM items i WHERE i.organization_id = o.id AND i.kind = 'found' AND i.status = 5) AS returned
     FROM organizations o ORDER BY o.id`);
  return rows.map(r => ({
    id: num(r.id), name: String(r.name), type: String(r.type), users: num(r.users), items: num(r.items),
    rate: pct(num(r.returned), num(r.received)),
  }));
}

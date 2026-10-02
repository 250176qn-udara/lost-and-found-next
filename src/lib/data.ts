import 'server-only';
import { all, one } from './db';
import { claimRow, itemRow } from './items';
import type {
  Claim, ClaimEvent, ClaimStatus, Item, ItemDetail, ItemStatus, Kind, MatchPair, Member, MemberRow, Notice, Organization,
  OrgItem, PendingRequest, QueueItem, Role,
} from './types';

// Read queries used by the pages. Callers check access first with requirePage().

export async function getOrganizations(): Promise<Organization[]> {
  return all<Organization>('SELECT id, name, type FROM organizations ORDER BY id');
}

export async function getMyItems(uid: number, orgId: number): Promise<Item[]> {
  const rows = await all<Record<string, unknown>>(
    `SELECT i.id, i.kind, i.title, i.category, i.place, i.item_date, i.description, i.status,
            (i.photo IS NOT NULL) AS has_photo, i.created_at, i.item_code, i.shelf, i.received_at, i.handed_in_at,
            i.matched_item_id, m.title AS matched_title, m.place AS matched_place, m.item_date AS matched_date
     FROM items i LEFT JOIN items m ON m.id = i.matched_item_id
     WHERE i.reporter_id = ? AND i.organization_id = ? ORDER BY i.id DESC`, [uid, orgId]);
  return rows.map(itemRow);
}

export async function getMyClaims(uid: number): Promise<Claim[]> {
  const rows = await all<Record<string, unknown>>(
    `SELECT c.id, c.status, c.created_at, c.answers, c.found_item_id, c.pickup_code, c.decided_at,
            i.title AS item_title, i.place AS item_place, i.item_date, i.item_code, i.shelf
     FROM claims c JOIN items i ON i.id = c.found_item_id
     WHERE c.claimant_id = ? ORDER BY c.id DESC`, [uid]);
  return rows.map(claimRow);
}

/** Found items only, and never the reporter's identity — browsing is anonymous by design. */
export async function getBrowseItems(orgId: number, category: string, uid = 0): Promise<Item[]> {
  const byCat = category !== '' && category !== 'All';
  const rows = await all<Record<string, unknown>>(
    `SELECT id, title, category, place, item_date, status, (photo IS NOT NULL) AS has_photo, (reporter_id = ?) AS mine
     FROM items WHERE organization_id = ? AND kind = 'found' AND status < 5 ${byCat ? 'AND category = ?' : ''}
     ORDER BY id DESC`, byCat ? [uid, orgId, category] : [uid, orgId]);
  return rows.map(r => ({ ...itemRow(r), mine: Boolean(Number(r.mine)) }));
}

/** Found items members posted that are still with the finder (not brought to the office yet, not returned). */
export async function getQueue(orgId: number): Promise<QueueItem[]> {
  const rows = await all<Record<string, unknown>>(
    `SELECT i.id, i.title, i.category, i.place, i.item_date, i.description, i.handed_in_at, u.name AS reporter_name
     FROM items i JOIN users u ON u.id = i.reporter_id
     WHERE i.organization_id = ? AND i.kind = 'found' AND i.received_at IS NULL AND i.status < 5
     ORDER BY i.handed_in_at IS NULL, i.handed_in_at, i.created_at`, [orgId]);
  return rows.map(r => ({
    id: Number(r.id),
    title: String(r.title),
    category: String(r.category),
    place: String(r.place),
    date: (r.item_date as string) ?? null,
    description: (r.description as string) ?? null,
    reporterName: String(r.reporter_name),
    handedInAt: (r.handed_in_at as string) ?? null,
  }));
}

export async function getClaimsQueue(orgId: number): Promise<Claim[]> {
  const rows = await all<Record<string, unknown>>(
    `SELECT c.id, c.status, c.created_at, c.answers, c.found_item_id, c.decided_at,
            i.title AS item_title, i.place AS item_place, i.item_date, i.item_code, i.shelf,
            i.description AS found_description,
            u.name AS claimant_name, u.email AS claimant_email,
            l.description AS lost_description, (i.received_at IS NOT NULL) AS at_office, (i.handed_in_at IS NOT NULL) AS handed_in, (c.pickup_code IS NOT NULL) AS has_code, f.name AS finder_name
     FROM claims c
     JOIN items i ON i.id = c.found_item_id
     JOIN users u ON u.id = c.claimant_id
     JOIN users f ON f.id = i.reporter_id
     LEFT JOIN items l ON l.id = c.lost_item_id
     WHERE i.organization_id = ? AND c.status IN ('pending','approved')
     ORDER BY c.status = 'pending' DESC, c.created_at`, [orgId]);
  return rows.map(claimRow);
}

export async function getAdminData(orgId: number): Promise<{ pending: PendingRequest[]; members: Member[] }> {
  const pending = await all<PendingRequest>(
    `SELECT m.id, u.name, u.email, o.name AS organization_name
     FROM organization_members m
     JOIN users u ON u.id = m.user_id
     JOIN organizations o ON o.id = m.organization_id
     WHERE m.organization_id = ? AND m.status = 'pending'
     ORDER BY m.requested_at, m.id`, [orgId]);
  const members = await all<Member>(
    `SELECT u.name, u.email, m.role
     FROM organization_members m JOIN users u ON u.id = m.user_id
     WHERE m.organization_id = ? AND m.status = 'approved'
     ORDER BY u.name`, [orgId]);
  return { pending, members };
}

// ---------- items ----------

const s = (v: unknown) => (v === null || v === undefined ? null : String(v));

/** One item of the organization, or null. The page decides what the viewer may see. */
export async function getItemDetail(id: number, orgId: number): Promise<ItemDetail | null> {
  const r = await one<Record<string, unknown>>(
    `SELECT i.id, i.kind, i.title, i.category, i.place, i.item_date, i.description, i.status,
            (i.photo IS NOT NULL) AS has_photo, i.item_code, i.shelf, i.finder_name, i.reporter_id,
            i.created_at, i.received_at, i.handed_in_at, i.matched_at, i.disposed_at, i.disposal_method, i.disposal_note,
            ru.name AS reporter_name, hu.name AS received_by_name,
            i.matched_item_id, m.title AS matched_title, m.place AS matched_place, m.item_date AS matched_date
     FROM items i
     JOIN users ru ON ru.id = i.reporter_id
     LEFT JOIN users hu ON hu.id = i.received_by
     LEFT JOIN items m ON m.id = i.matched_item_id
     WHERE i.id = ? AND i.organization_id = ?`, [id, orgId]);
  if (!r) return null;
  return {
    ...itemRow(r),
    itemCode: s(r.item_code), shelf: s(r.shelf), finderName: s(r.finder_name),
    reporterId: Number(r.reporter_id), reporterName: String(r.reporter_name), receivedByName: s(r.received_by_name),
    createdAt: String(r.created_at), receivedAt: s(r.received_at), handedInAt: s(r.handed_in_at), matchedAt: s(r.matched_at),
    disposedAt: s(r.disposed_at), disposalMethod: s(r.disposal_method), disposalNote: s(r.disposal_note),
  };
}

/** Claims on an item (as the found item or as the claimant's lost report). Check the item's organization first. */
export async function getClaimEvents(itemId: number): Promise<ClaimEvent[]> {
  const rows = await all<Record<string, unknown>>(
    `SELECT c.id, c.status, c.created_at, c.decided_at, c.returned_at, c.id_type,
            u.name AS claimant_name, d.name AS decided_by_name, r.name AS returned_by_name
     FROM claims c
     JOIN users u ON u.id = c.claimant_id
     LEFT JOIN users d ON d.id = c.decided_by
     LEFT JOIN users r ON r.id = c.returned_by
     WHERE c.found_item_id = ? OR c.lost_item_id = ? ORDER BY c.id`, [itemId, itemId]);
  return rows.map(r => ({
    id: Number(r.id), status: r.status as ClaimStatus, claimantName: String(r.claimant_name), createdAt: String(r.created_at),
    decidedAt: s(r.decided_at), decidedByName: s(r.decided_by_name), returnedAt: s(r.returned_at),
    returnedByName: s(r.returned_by_name), idType: s(r.id_type),
  }));
}

export async function getOrgItems(orgId: number): Promise<OrgItem[]> {
  const rows = await all<Record<string, unknown>>(
    `SELECT i.id, i.kind, i.title, i.category, i.place, i.item_date, i.status, i.item_code, i.shelf, i.created_at,
            u.name AS reporter_name, IF(i.received_at IS NULL, NULL, DATEDIFF(NOW(), i.received_at)) AS days_kept
     FROM items i JOIN users u ON u.id = i.reporter_id
     WHERE i.organization_id = ? ORDER BY i.id DESC`, [orgId]);
  return rows.map(r => ({
    id: Number(r.id), kind: r.kind as Kind, title: String(r.title), category: String(r.category), place: String(r.place),
    date: s(r.item_date), status: Number(r.status) as ItemStatus, itemCode: s(r.item_code), shelf: s(r.shelf),
    createdAt: String(r.created_at), reporterName: String(r.reporter_name),
    daysKept: r.days_kept === null ? null : Number(r.days_kept),
  }));
}

/** Found items that are at the office now (staff received them, not yet returned). Items still with the finder have no daysKept. */
export const atOffice = (i: OrgItem) => i.kind === 'found' && i.status >= 2 && i.status <= 4 && i.daysKept !== null;

/** Open lost reports with the found item the system linked to them. Pass uid to get only that member's reports. */
export async function getMatchPairs(orgId: number, uid?: number): Promise<(MatchPair & { claimStatus: ClaimStatus | null })[]> {
  const rows = await all<Record<string, unknown>>(
    `SELECT l.id AS lost_id, l.title AS lost_title, l.place AS lost_place, l.item_date AS lost_date, l.status AS lost_status,
            u.name AS owner_name, f.id AS found_id, f.title AS found_title, f.place AS found_place,
            f.item_date AS found_date, f.item_code AS found_code,
            (SELECT c.status FROM claims c WHERE c.found_item_id = f.id AND c.claimant_id = l.reporter_id
             ORDER BY c.id DESC LIMIT 1) AS claim_status
     FROM items l
     JOIN items f ON f.id = l.matched_item_id
     JOIN users u ON u.id = l.reporter_id
     WHERE l.organization_id = ? AND l.kind = 'lost' AND l.status < 5 ${uid ? 'AND l.reporter_id = ?' : ''}
     ORDER BY l.matched_at DESC, l.id DESC`, uid ? [orgId, uid] : [orgId]);
  return rows.map(r => ({
    lostId: Number(r.lost_id), lostTitle: String(r.lost_title), lostPlace: String(r.lost_place), lostDate: s(r.lost_date),
    lostStatus: Number(r.lost_status) as ItemStatus, ownerName: String(r.owner_name),
    foundId: Number(r.found_id), foundTitle: String(r.found_title), foundPlace: String(r.found_place),
    foundDate: s(r.found_date), foundCode: s(r.found_code), claimStatus: (r.claim_status as ClaimStatus) ?? null,
  }));
}

/** Items staff can link by hand: open lost reports, and found items at the office, neither matched yet. */
export async function getLinkCandidates(orgId: number) {
  const rows = await all<{ id: number; kind: Kind; title: string; place: string; item_code: string | null; owner: string }>(
    `SELECT i.id, i.kind, i.title, i.place, i.item_code, u.name AS owner
     FROM items i JOIN users u ON u.id = i.reporter_id
     WHERE i.organization_id = ? AND i.matched_item_id IS NULL
       AND ((i.kind = 'lost' AND i.status = 1) OR (i.kind = 'found' AND i.status = 2))
     ORDER BY i.id DESC`, [orgId]);
  return { lost: rows.filter(r => r.kind === 'lost'), found: rows.filter(r => r.kind === 'found') };
}

// ---------- the member's claims ----------

export type Pickup = { claimId: number; title: string; itemCode: string | null; shelf: string | null; approvedAt: string | null; orgName: string };

export async function getMyPickups(uid: number): Promise<Pickup[]> {
  const rows = await all<Record<string, unknown>>(
    `SELECT c.id, c.decided_at, i.title, i.item_code, i.shelf, o.name AS org_name
     FROM claims c JOIN items i ON i.id = c.found_item_id JOIN organizations o ON o.id = i.organization_id
     WHERE c.claimant_id = ? AND c.status = 'approved' ORDER BY c.decided_at DESC`, [uid]);
  return rows.map(r => ({
    claimId: Number(r.id), title: String(r.title), itemCode: s(r.item_code), shelf: s(r.shelf),
    approvedAt: s(r.decided_at), orgName: String(r.org_name),
  }));
}

export type ReturnRow = {
  claimId: number; title: string; place: string; itemCode: string | null; claimedAt: string; returnedAt: string;
  orgName: string; ownerName: string; idType: string | null;
};

/** Items returned to the member. Pass claimId to get one (still only the member's own). */
export async function getMyReturns(uid: number, claimId?: number): Promise<ReturnRow[]> {
  const rows = await all<Record<string, unknown>>(
    `SELECT c.id, c.created_at, c.returned_at, c.id_type, i.title, i.place, i.item_code, o.name AS org_name, u.name AS owner_name
     FROM claims c
     JOIN items i ON i.id = c.found_item_id
     JOIN organizations o ON o.id = i.organization_id
     JOIN users u ON u.id = c.claimant_id
     WHERE c.claimant_id = ? AND c.status = 'returned' ${claimId ? 'AND c.id = ?' : ''}
     ORDER BY c.returned_at DESC`, claimId ? [uid, claimId] : [uid]);
  return rows.map(r => ({
    claimId: Number(r.id), title: String(r.title), place: String(r.place), itemCode: s(r.item_code),
    claimedAt: String(r.created_at), returnedAt: String(r.returned_at), orgName: String(r.org_name),
    ownerName: String(r.owner_name), idType: s(r.id_type),
  }));
}

// ---------- people ----------

export async function getMemberRows(orgId: number): Promise<MemberRow[]> {
  const rows = await all<Record<string, unknown>>(
    `SELECT m.id, u.id AS user_id, u.name, u.email, m.role, m.approved_at
     FROM organization_members m JOIN users u ON u.id = m.user_id
     WHERE m.organization_id = ? AND m.status = 'approved'
     ORDER BY FIELD(m.role, 'admin', 'staff', 'member'), u.name`, [orgId]);
  return rows.map(r => ({
    membershipId: Number(r.id), userId: Number(r.user_id), name: String(r.name), email: String(r.email),
    role: r.role as Role, since: s(r.approved_at)?.slice(0, 10) ?? null,
  }));
}

// ---------- notifications (built from what happened to the user's items; read state is kept in the browser) ----------

export async function getMemberNotices(uid: number, orgId: number): Promise<Notice[]> {
  const [claims, matches, handedIn, onMyFinds] = await Promise.all([
    all<{ id: number; status: ClaimStatus; title: string; decided_at: string | null; returned_at: string | null }>(
      `SELECT c.id, c.status, i.title, c.decided_at, c.returned_at
       FROM claims c JOIN items i ON i.id = c.found_item_id
       WHERE c.claimant_id = ? AND c.status <> 'pending'`, [uid]),
    all<{ id: number; title: string; matched_at: string | null }>(
      `SELECT id, title, matched_at FROM items
       WHERE reporter_id = ? AND organization_id = ? AND kind = 'lost' AND status = 3 AND matched_item_id IS NOT NULL`, [uid, orgId]),
    all<{ id: number; title: string; received_at: string }>(
      `SELECT id, title, received_at FROM items
       WHERE reporter_id = ? AND organization_id = ? AND kind = 'found' AND received_at IS NOT NULL`, [uid, orgId]),
    // Claims other people sent on found items this member posted (the claimant stays anonymous).
    all<{ id: number; item_id: number; status: ClaimStatus; title: string; created_at: string; decided_at: string | null; at_office: number }>(
      `SELECT c.id, i.id AS item_id, c.status, i.title, c.created_at, c.decided_at, (i.received_at IS NOT NULL) AS at_office
       FROM claims c JOIN items i ON i.id = c.found_item_id
       WHERE i.reporter_id = ? AND i.organization_id = ? AND c.claimant_id <> ?`, [uid, orgId, uid]),
  ]);
  const list: Notice[] = [];
  for (const c of onMyFinds) {
    list.push({ id: `fc${c.id}`, title: 'Someone has claimed the item you reported', text: c.title, at: c.created_at, href: `/items/${c.item_id}` });
    if (c.status === 'approved' && !Number(c.at_office))
      list.push({ id: `fa${c.id}`, title: 'The owner was confirmed. Please hand the item to the office', text: c.title, at: c.decided_at ?? c.created_at, href: `/items/${c.item_id}` });
  }
  for (const c of claims) {
    if (c.status === 'approved') list.push({ id: `ca${c.id}`, title: 'Claim approved', text: c.title, at: c.decided_at ?? '', href: '/my-items?tab=claims' });
    if (c.status === 'rejected') list.push({ id: `cr${c.id}`, title: 'Claim rejected', text: c.title, at: c.decided_at ?? '', href: '/my-items' });
    if (c.status === 'returned') list.push({ id: `rt${c.id}`, title: 'Item returned to you', text: c.title, at: c.returned_at ?? '', href: '/my-items?tab=claims' });
  }
  for (const m of matches) list.push({ id: `m${m.id}`, title: 'Possible match found', text: m.title, at: m.matched_at ?? '', href: '/my-items' });
  for (const h of handedIn) list.push({ id: `hi${h.id}`, title: 'The item you found reached the office', text: h.title, at: h.received_at, href: `/items/${h.id}` });
  return list.sort((a, b) => b.at.localeCompare(a.at));
}

export async function getStaffNotices(orgId: number): Promise<Notice[]> {
  const [items, claims] = await Promise.all([
    all<{ id: number; title: string; created_at: string; handed_in_at: string | null }>(
      `SELECT id, title, created_at, handed_in_at FROM items
       WHERE organization_id = ? AND kind = 'found' AND received_at IS NULL AND status < 5`, [orgId]),
    all<{ id: number; status: ClaimStatus; title: string; created_at: string; decided_at: string | null }>(
      `SELECT c.id, c.status, i.title, c.created_at, c.decided_at
       FROM claims c JOIN items i ON i.id = c.found_item_id
       WHERE i.organization_id = ? AND c.status IN ('pending','approved')`, [orgId]),
  ]);
  const list: Notice[] = items.map(i => i.handed_in_at
    ? { id: `hd${i.id}`, title: 'A finder handed an item to the office. Please confirm it', text: i.title, at: i.handed_in_at, href: '/desk?tab=finders' }
    : { id: `q${i.id}`, title: 'A member posted a found item', text: i.title, at: i.created_at, href: `/items/${i.id}` });
  for (const c of claims) {
    list.push(c.status === 'pending'
      ? { id: `cp${c.id}`, title: 'Claim waiting for verification', text: c.title, at: c.created_at, href: '/desk' }
      : { id: `ch${c.id}`, title: 'Ready for handover', text: c.title, at: c.decided_at ?? c.created_at, href: '/desk?tab=pickups' });
  }
  return list.sort((a, b) => b.at.localeCompare(a.at));
}

/** Found items this member posted that someone claimed and that are not at the office yet (finder must hand them in). */
export async function getFinderTasks(uid: number, orgId: number) {
  return all<{ id: number; title: string; claim_status: ClaimStatus; handed_in_at: string | null }>(
    `SELECT i.id, i.title, i.handed_in_at,
            (SELECT c.status FROM claims c WHERE c.found_item_id = i.id AND c.status IN ('pending','approved')
             ORDER BY c.status = 'approved' DESC, c.id DESC LIMIT 1) AS claim_status
     FROM items i
     WHERE i.reporter_id = ? AND i.organization_id = ? AND i.kind = 'found' AND i.received_at IS NULL AND i.status < 5
     HAVING claim_status IS NOT NULL
     ORDER BY i.id DESC`, [uid, orgId]);
}

export type ClosedItem = { id: number; itemCode: string | null; title: string; method: string; note: string | null; at: string; by: string | null };

/** Items that left the office without their owner (status 6). */
export async function getClosedItems(orgId: number): Promise<ClosedItem[]> {
  const rows = await all<Record<string, unknown>>(
    `SELECT i.id, i.item_code, i.title, i.disposal_method, i.disposal_note, i.disposed_at, u.name AS by_name
     FROM items i LEFT JOIN users u ON u.id = i.disposed_by
     WHERE i.organization_id = ? AND i.status = 6 ORDER BY i.disposed_at DESC`, [orgId]);
  return rows.map(r => ({
    id: Number(r.id), itemCode: s(r.item_code), title: String(r.title), method: String(r.disposal_method ?? ''),
    note: s(r.disposal_note), at: String(r.disposed_at ?? ''), by: s(r.by_name),
  }));
}

/** Open claim status on each found item this member posted: item id -> 'pending' | 'approved' (claimant stays anonymous). */
export async function getClaimsOnMyFinds(uid: number, orgId: number): Promise<Map<number, ClaimStatus>> {
  const rows = await all<{ item_id: number; status: ClaimStatus }>(
    `SELECT i.id AS item_id, c.status FROM claims c JOIN items i ON i.id = c.found_item_id
     WHERE i.reporter_id = ? AND i.organization_id = ? AND c.status IN ('pending','approved','returned')
     ORDER BY FIELD(c.status, 'pending', 'approved', 'returned')`, [uid, orgId]);
  const map = new Map<number, ClaimStatus>();
  for (const r of rows) map.set(Number(r.item_id), r.status); // later rows win: returned > approved > pending
  return map;
}

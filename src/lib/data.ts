import 'server-only';
import { cache } from 'react';
import { FINDER_KEEP_DAYS, type NotifyEvent } from './constants';
import { getPrefs, getReadIds } from './prefs';
import { buildingOf } from './places';
import { all, one } from './db';
import { num } from './geo';
import { claimRow, itemRow } from './items';
import type {
  Claim, ClaimEvent, ClaimStatus, Item, ItemDetail, ItemStatus, Kind, MatchPair, Member, MemberRow, Notice, Organization,
  OrgItem, PendingRequest, Place, QueueItem, Role,
} from './types';

// Read queries used by the pages. Callers check access first with requirePage().

export async function getOrganizations(): Promise<Organization[]> {
  return all<Organization>('SELECT id, name, type FROM organizations ORDER BY id');
}

export async function getMyItems(uid: number, orgId: number): Promise<Item[]> {
  const rows = await all<Record<string, unknown>>(
    `SELECT i.id, i.kind, i.title, i.category, i.place, i.lat, i.lng, i.item_date, i.description, i.status,
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
    `SELECT id, title, category, place, lat, lng, item_date, status, (photo IS NOT NULL) AS has_photo, (reporter_id = ?) AS mine,
            (SELECT c.status FROM claims c WHERE c.found_item_id = items.id AND c.claimant_id = ? AND c.status IN ('pending','approved')
             ORDER BY c.id DESC LIMIT 1) AS my_claim
     FROM items WHERE organization_id = ? AND kind = 'found' AND status < 5 ${byCat ? 'AND category = ?' : ''}
     ORDER BY id DESC`, byCat ? [uid, uid, orgId, category] : [uid, uid, orgId]);
  return rows.map(r => ({ ...itemRow(r), mine: Boolean(Number(r.mine)), myClaim: (r.my_claim as ClaimStatus) ?? null }));
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
            c.claimant_id, u.name AS claimant_name,
            IF(COALESCE(up.share_email, 1) = 1, u.email, NULL) AS claimant_email, -- the member may hide it (Account → Privacy)
            l.description AS lost_description, (i.received_at IS NOT NULL) AS at_office, (i.handed_in_at IS NOT NULL) AS handed_in, (c.pickup_code IS NOT NULL) AS has_code, f.name AS finder_name
     FROM claims c
     JOIN items i ON i.id = c.found_item_id
     JOIN users u ON u.id = c.claimant_id
     LEFT JOIN user_prefs up ON up.user_id = c.claimant_id
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
    `SELECT i.id, i.kind, i.title, i.category, i.place, i.lat, i.lng, i.item_date, i.description, i.status,
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
    `SELECT c.id, c.status, c.claimant_id, c.created_at, c.decided_at, c.returned_at, c.id_type,
            u.name AS claimant_name, d.name AS decided_by_name, r.name AS returned_by_name
     FROM claims c
     JOIN users u ON u.id = c.claimant_id
     LEFT JOIN users d ON d.id = c.decided_by
     LEFT JOIN users r ON r.id = c.returned_by
     WHERE c.found_item_id = ? OR c.lost_item_id = ? ORDER BY c.id`, [itemId, itemId]);
  return rows.map(r => ({
    id: Number(r.id), status: r.status as ClaimStatus, claimantId: Number(r.claimant_id), claimantName: String(r.claimant_name), createdAt: String(r.created_at),
    decidedAt: s(r.decided_at), decidedByName: s(r.decided_by_name), returnedAt: s(r.returned_at),
    returnedByName: s(r.returned_by_name), idType: s(r.id_type),
  }));
}

export async function getOrgItems(orgId: number): Promise<OrgItem[]> {
  const rows = await all<Record<string, unknown>>(
    `SELECT i.id, i.kind, i.title, i.category, i.place, i.lat, i.lng, i.item_date, i.status, i.item_code, i.shelf, i.created_at,
            (i.photo IS NOT NULL) AS has_photo, u.name AS reporter_name, IF(i.received_at IS NULL, NULL, DATEDIFF(NOW(), i.received_at)) AS days_kept
     FROM items i JOIN users u ON u.id = i.reporter_id
     WHERE i.organization_id = ? ORDER BY i.id DESC`, [orgId]);
  return rows.map(r => ({
    id: Number(r.id), kind: r.kind as Kind, title: String(r.title), hasPhoto: Boolean(Number(r.has_photo)), category: String(r.category), place: String(r.place),
    date: s(r.item_date), status: Number(r.status) as ItemStatus, itemCode: s(r.item_code), shelf: s(r.shelf),
    createdAt: String(r.created_at), reporterName: String(r.reporter_name),
    daysKept: r.days_kept === null ? null : Number(r.days_kept),
    lat: num(r.lat), lng: num(r.lng),
  }));
}

/** Found items that are at the office now (staff received them, not yet returned). Items still with the finder have no daysKept. */
export const atOffice = (i: OrgItem) => i.kind === 'found' && i.status >= 2 && i.status <= 4 && i.daysKept !== null;

/** Open lost reports with the found item the system linked to them. Pass uid to get only that member's reports. */
export async function getMatchPairs(orgId: number, uid?: number): Promise<(MatchPair & { claimStatus: ClaimStatus | null })[]> {
  const rows = await all<Record<string, unknown>>(
    `SELECT l.id AS lost_id, l.title AS lost_title, l.place AS lost_place, l.item_date AS lost_date, l.status AS lost_status,
            l.lat AS lost_lat, l.lng AS lost_lng, f.lat AS found_lat, f.lng AS found_lng,
            u.name AS owner_name, f.id AS found_id, f.title AS found_title, f.place AS found_place,
            f.item_date AS found_date, f.item_code AS found_code,
            l.category AS lost_category, f.category AS found_category, l.ai_score, l.ai_reason,
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
    lostLat: num(r.lost_lat), lostLng: num(r.lost_lng), foundLat: num(r.found_lat), foundLng: num(r.found_lng),
    lostCategory: String(r.lost_category), foundCategory: String(r.found_category),
    aiScore: r.ai_score == null ? null : Number(r.ai_score), aiReason: s(r.ai_reason),
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

// ---------- notifications (built from what happened to the user's items; read state is in notice_reads) ----------

/** Which kind a notice is, from its id prefix (see the builders below). */
function noticeEvent(id: string): NotifyEvent {
  if (id.startsWith('om')) return 'messages';
  if (id.startsWith('sa')) return 'alerts';
  if (id.startsWith('sg')) return 'matches';
  if (id.startsWith('rx') || id.startsWith('ty') || id.startsWith('pt')) return 'thanks';
  if (/^m\d/.test(id)) return 'matches';
  if (id.startsWith('hd') || id.startsWith('q') || id.startsWith('ko')) return 'items';
  return 'claims';
}

/** The user's notifications with read state, without the kinds they turned off in the app. Cached per request. */
export const getNotices = cache(async (uid: number, role: Role, orgId: number): Promise<Notice[]> => {
  const [list, prefs, read] = await Promise.all([
    role === 'member' ? getMemberNotices(uid, orgId) : getStaffNotices(orgId), getPrefs(uid), getReadIds(uid)]);
  return list.map(n => ({ ...n, event: noticeEvent(n.id), read: read.has(n.id) })).filter(n => prefs.notify[n.event].app);
});

export async function getMemberNotices(uid: number, orgId: number): Promise<Notice[]> {
  const [claims, matches, handedIn, onMyFinds] = await Promise.all([
    all<{ id: number; status: ClaimStatus; title: string; decided_at: string | null; returned_at: string | null; pickup_code: string | null }>(
      `SELECT c.id, c.status, i.title, c.decided_at, c.returned_at, c.pickup_code
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
      `SELECT c.id, i.id AS item_id, c.status, i.title, c.created_at, c.decided_at, (i.received_at IS NOT NULL OR i.handed_in_at IS NOT NULL) AS at_office
       FROM claims c JOIN items i ON i.id = c.found_item_id
       WHERE i.reporter_id = ? AND i.organization_id = ? AND c.claimant_id <> ?`, [uid, orgId, uid]),
  ]);
  const letters = await all<{ id: number; title: string; created_at: string; gift_amount: number | null }>(
    `SELECT t.id, i.title, t.created_at, t.gift_amount FROM thanks t
     JOIN claims c ON c.id = t.claim_id JOIN items i ON i.id = c.found_item_id WHERE t.to_user = ?`, [uid]);
  const list: Notice[] = [];
  const chat = await one<{ id: number; body: string; created_at: string; claimed: number | null }>(
    `SELECT m.id, m.body, m.created_at,
            (SELECT c.id FROM claims c WHERE c.found_item_id = m.item_id AND c.claimant_id = m.member_id LIMIT 1) AS claimed
     FROM office_messages m
     WHERE m.organization_id = ? AND m.member_id = ? AND m.from_staff = 1 AND m.read_at IS NULL ORDER BY m.id DESC LIMIT 1`, [orgId, uid]);
  if (chat) list.push({
    id: `om${chat.id}`, title: chat.claimed ? 'The office asked about your claim' : 'New message from the office',
    text: chat.body.slice(0, 80), at: chat.created_at, href: '/messages',
  });
  // "Have you seen this?" in the buildings this member watches, and notes from people who saw the member's own lost items.
  const [{ alertAreas }, help, seen] = await Promise.all([
    getPrefs(uid),
    all<{ id: number; title: string; place: string; created_at: string }>(
      `SELECT id, title, place, created_at FROM items WHERE organization_id = ? AND kind = 'lost' AND ask_help = 1 AND status BETWEEN 1 AND 3
         AND reporter_id <> ? AND created_at > NOW() - INTERVAL 14 DAY`, [orgId, uid]),
    all<{ id: number; note: string; title: string; created_at: string }>(
      `SELECT g.id, g.note, i.title, g.created_at FROM sightings g JOIN items i ON i.id = g.item_id
       WHERE i.reporter_id = ? AND i.organization_id = ? ORDER BY g.id DESC LIMIT 20`, [uid, orgId]),
  ]);
  for (const h of help) if (alertAreas.includes(buildingOf(h.place)))
    list.push({ id: `sa${h.id}`, title: 'Have you seen this?', text: `${h.title} · ${h.place}`, at: h.created_at, href: `/browse?view=help#i${h.id}` });
  for (const g of seen) list.push({ id: `sg${g.id}`, title: 'Someone may have seen your item', text: `${g.title}: ${g.note}`, at: g.created_at, href: '/my-items' });
  const earned = await all<{ id: number; points: number; reason: string; title: string | null; created_at: string }>(
    `SELECT p.id, p.points, p.reason, i.title, p.created_at FROM points p LEFT JOIN items i ON i.id = p.item_id
     WHERE p.user_id = ? AND p.organization_id = ? AND p.reason <> 'wrote_thanks' ORDER BY p.id DESC LIMIT 20`, [uid, orgId]);
  for (const e of earned) list.push({ id: `pt${e.id}`, title: 'You earned thank-you points', text: `+${e.points} · ${e.title ?? ''}`, at: e.created_at, href: '/my-items?tab=points' });
  const reacted = await all<{ id: number; title: string; reaction: string; reacted_at: string }>(
    `SELECT t.id, i.title, t.reaction, t.reacted_at FROM thanks t
     JOIN claims c ON c.id = t.claim_id JOIN items i ON i.id = c.found_item_id
     WHERE t.from_user = ? AND t.reaction IS NOT NULL`, [uid]);
  for (const r of reacted) list.push({ id: `rx${r.id}-${r.reacted_at}`, title: 'The finder reacted to your thank-you letter', text: `${r.reaction} ${r.title}`, at: r.reacted_at, href: '/my-items?tab=thanks' });
  list.push(...letters.map(l => ({
    id: `ty${l.id}`, title: l.gift_amount ? 'You received a thank-you letter and a gift' : 'You received a thank-you letter',
    text: l.title, at: l.created_at, href: '/my-items?tab=thanks',
  })));
  for (const c of onMyFinds) {
    list.push({ id: `fc${c.id}`, title: 'Someone has claimed the item you reported', text: c.title, at: c.created_at, href: `/items/${c.item_id}` });
    if (c.status === 'approved' && !Number(c.at_office))
      list.push({ id: `fa${c.id}`, title: 'Thank you for your help! The owner was found — please bring the item to the office', text: c.title, at: c.decided_at ?? c.created_at, href: `/items/${c.item_id}` });
  }
  for (const c of claims) {
    // The pickup code goes to the claimant automatically (only they receive this notification).
    if (c.status === 'approved') list.push({ id: `ca${c.id}`, title: 'Claim approved — your pickup code is ready', text: c.pickup_code ? `${c.title} · ${c.pickup_code}` : c.title, at: c.decided_at ?? '', href: '/my-items?tab=claims' });
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
  const list: Notice[] = [];
  const chats = await all<{ id: number; member_id: number; name: string; created_at: string }>(
    `SELECT MAX(m.id) AS id, m.member_id, u.name, MAX(m.created_at) AS created_at FROM office_messages m JOIN users u ON u.id = m.member_id
     WHERE m.organization_id = ? AND m.from_staff = 0 AND m.read_at IS NULL GROUP BY m.member_id, u.name`, [orgId]);
  for (const c of chats) list.push({ id: `om${c.id}`, title: 'New message from a member', text: c.name, at: c.created_at, href: `/messages?with=${c.member_id}` });
  list.push(...items.map(i => i.handed_in_at
    ? { id: `hd${i.id}`, title: 'A finder handed an item to the office. Please confirm it', text: i.title, at: i.handed_in_at, href: '/desk?tab=finders' }
    : { id: `q${i.id}`, title: 'A member posted a found item', text: i.title, at: i.created_at, href: `/items/${i.id}` }));
  // Finders who kept an item past the time limit (the finder was already reminded).
  const late = await all<{ id: number; title: string; name: string; due: string }>(
    `SELECT i.id, i.title, u.name, DATE_FORMAT(DATE_ADD(i.created_at, INTERVAL COALESCE(s.finder_keep_days, ?) DAY), '%Y-%m-%d %H:%i:%s') AS due
     FROM items i JOIN users u ON u.id = i.reporter_id LEFT JOIN org_settings s ON s.organization_id = i.organization_id
     WHERE i.organization_id = ? AND i.kind = 'found' AND i.status < 5 AND i.received_at IS NULL AND i.handed_in_at IS NULL
       AND NOW() >= DATE_ADD(i.created_at, INTERVAL COALESCE(s.finder_keep_days, ?) DAY)`, [FINDER_KEEP_DAYS, orgId, FINDER_KEEP_DAYS]);
  for (const l of late) list.push({ id: `ko${l.id}`, title: 'A finder has not handed an item in on time', text: `${l.title} · ${l.name}`, at: l.due, href: `/items/${l.id}` });
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

// ---------- places ----------

export async function getPlaces(orgId: number): Promise<Place[]> {
  const rows = await all<Record<string, unknown>>('SELECT id, name, lat, lng FROM places WHERE organization_id = ? ORDER BY name', [orgId]);
  return rows.map(r => ({ id: Number(r.id), name: String(r.name), lat: num(r.lat), lng: num(r.lng) }));
}

// ---------- thank-you letters ----------

export type Thanks = {
  id: number; claimId: number; itemId: number; itemTitle: string; message: string; card: string; fromName: string | null; toName: string;
  giftBrand: string | null; giftAmount: number | null; giftCode: string | null; createdAt: string; readAt: string | null;
  reaction: string | null; reactedAt: string | null;
  /** Thank-you points the owner added. */
  points: number;
};

const thanksRow = (r: Record<string, unknown>): Thanks => ({
  id: Number(r.id), claimId: Number(r.claim_id), itemId: Number(r.item_id), itemTitle: String(r.item_title), message: String(r.message), card: String(r.card),
  fromName: Number(r.show_name) ? String(r.from_name) : null, toName: String(r.to_name),
  giftBrand: s(r.gift_brand), giftAmount: r.gift_amount === null ? null : Number(r.gift_amount), giftCode: s(r.gift_code),
  createdAt: String(r.created_at), readAt: s(r.read_at), reaction: s(r.reaction), reactedAt: s(r.reacted_at), points: Number(r.points ?? 0),
});

/** Letters this member received (as finder) or sent (as owner). The gift code is only returned to the finder. */
export async function getThanks(uid: number): Promise<{ received: Thanks[]; sent: Thanks[] }> {
  const rows = await all<Record<string, unknown>>(
    `SELECT t.*, c.found_item_id AS item_id, i.title AS item_title, fu.name AS from_name, tu.name AS to_name
     FROM thanks t
     JOIN claims c ON c.id = t.claim_id JOIN items i ON i.id = c.found_item_id
     JOIN users fu ON fu.id = t.from_user JOIN users tu ON tu.id = t.to_user
     WHERE t.to_user = ? OR t.from_user = ? ORDER BY t.created_at DESC`, [uid, uid]);
  return {
    received: rows.filter(r => Number(r.to_user) === uid).map(thanksRow),
    sent: rows.filter(r => Number(r.from_user) === uid).map(r => ({ ...thanksRow(r), giftCode: null, fromName: 'you' })),
  };
}

/** Returned claims of this member that have no thank-you letter yet (and a finder who can receive one). */
export async function getUnthankedReturns(uid: number) {
  return all<{ claim_id: number; title: string }>(
    `SELECT c.id AS claim_id, i.title FROM claims c JOIN items i ON i.id = c.found_item_id
     LEFT JOIN thanks t ON t.claim_id = c.id
     WHERE c.claimant_id = ? AND c.status = 'returned' AND t.id IS NULL AND i.reporter_id <> c.claimant_id
     ORDER BY c.returned_at DESC`, [uid]);
}

// ---------- questions about a claim (office staff <-> claimant) ----------

export type ClaimMessage = { id: number; claimId: number; fromStaff: boolean; senderName: string; body: string; createdAt: string; readAt: string | null };

/**
 * Messages about the given claims, oldest first. They live in the claimant's office conversation (Messages page),
 * tagged with the claimed item, so they show up in both places. Callers make sure the viewer may see these claims.
 */
export async function getClaimMessages(claimIds: number[]): Promise<Record<number, ClaimMessage[]>> {
  const out: Record<number, ClaimMessage[]> = {};
  if (!claimIds.length) return out;
  const rows = await all<Record<string, unknown>>(
    `SELECT m.id, c.id AS claim_id, m.from_staff, m.body, m.created_at, m.read_at, COALESCE(u.name, 'Lost & Found') AS sender_name
     FROM claims c
     JOIN items i ON i.id = c.found_item_id
     JOIN office_messages m ON m.organization_id = i.organization_id AND m.member_id = c.claimant_id AND m.item_id = c.found_item_id
     LEFT JOIN users u ON u.id = m.sender_id
     WHERE c.id IN (${claimIds.map(() => '?').join(',')}) ORDER BY m.id`, claimIds);
  for (const r of rows) {
    const m: ClaimMessage = {
      id: Number(r.id), claimId: Number(r.claim_id), fromStaff: Boolean(Number(r.from_staff)), senderName: String(r.sender_name),
      body: String(r.body), createdAt: String(r.created_at), readAt: s(r.read_at),
    };
    (out[m.claimId] ??= []).push(m);
  }
  return out;
}

// ---------- office chat (member <-> the organization's office) ----------

export type OfficeMessage = { id: number; fromStaff: boolean; system: boolean; senderId: number | null; senderName: string | null; body: string; itemId: number | null; createdAt: string; readAt: string | null };
export type OfficeThread = { memberId: number; name: string; email: string; last: string; lastAt: string; lastFromStaff: boolean; unread: number };

export async function getOfficeMessages(orgId: number, memberId: number): Promise<OfficeMessage[]> {
  const rows = await all<Record<string, unknown>>(
    `SELECT m.id, m.from_staff, m.sender_id, m.body, m.item_id, m.created_at, m.read_at, u.name AS sender_name
     FROM office_messages m LEFT JOIN users u ON u.id = m.sender_id
     WHERE m.organization_id = ? AND m.member_id = ? ORDER BY m.id`, [orgId, memberId]);
  return rows.map(r => ({
    id: Number(r.id), fromStaff: Boolean(Number(r.from_staff)), system: r.sender_id === null,
    senderId: r.sender_id === null ? null : Number(r.sender_id), senderName: s(r.sender_name),
    body: String(r.body), itemId: r.item_id === null ? null : Number(r.item_id), createdAt: String(r.created_at), readAt: s(r.read_at),
  }));
}

/** The office inbox: one row per member who has a conversation, newest first. */
export async function getOfficeThreads(orgId: number): Promise<OfficeThread[]> {
  const rows = await all<Record<string, unknown>>(
    `SELECT t.member_id, u.name, u.email, lm.body AS last, lm.created_at AS last_at, lm.from_staff AS last_from_staff, t.unread
     FROM (SELECT member_id, MAX(id) AS last_id, SUM(from_staff = 0 AND read_at IS NULL) AS unread
           FROM office_messages WHERE organization_id = ? GROUP BY member_id) t
     JOIN office_messages lm ON lm.id = t.last_id
     JOIN users u ON u.id = t.member_id
     ORDER BY lm.id DESC`, [orgId]);
  return rows.map(r => ({
    memberId: Number(r.member_id), name: String(r.name), email: String(r.email), last: String(r.last), lastAt: String(r.last_at),
    lastFromStaff: Boolean(Number(r.last_from_staff)), unread: Number(r.unread ?? 0),
  }));
}

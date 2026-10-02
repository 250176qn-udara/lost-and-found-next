'use server';

// All writes go through these Server Actions (they replace the POST actions of api/index.php).
// Next.js checks the Origin header of every Server Action, which replaces the old CSRF token.

import bcrypt from 'bcryptjs';
import { randomInt } from 'node:crypto';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { handle, maxLen, parseDate, parsePhoto, str, type Result } from '@/lib/action';
import { ActionError, getSession, loadState, requireAdmin, requireLogin, requireMember, requireStaff, startPath } from '@/lib/auth';
import { all, exec, one, transaction } from '@/lib/db';
import { DEV_DEFAULT_PASSWORD, DEV_LOGIN } from '@/lib/devlogin';
import { DISPOSAL_METHODS } from '@/lib/constants';
import { applyMatch, findMatchFor } from '@/lib/items';
import { now } from '@/lib/session';
import type { ItemStatus, Kind, Lang, ScannedItem } from '@/lib/types';

const refresh = () => revalidatePath('/', 'layout');

async function signIn(uid: number) {
  const s = await getSession();
  s.uid = uid;
  s.lastActivity = now();
  await s.save();
  const me = await loadState(uid);
  return { to: me ? startPath(me.user) : '/login' };
}

// ---------- account ----------

export async function login(email: string, password: string): Promise<Result<{ to: string }>> {
  return handle(async () => {
    email = email.trim().toLowerCase();
    if (DEV_LOGIN) {
      // Development shortcut: the name (or email) is enough. See src/lib/devlogin.ts.
      const found = await all<{ id: number }>('SELECT id FROM users WHERE email = ? OR LOWER(name) = ? LIMIT 2', [email, email]);
      if (found.length === 0) throw new ActionError('No account with this name or email.');
      if (found.length > 1) throw new ActionError('More than one account has this name. Use the email instead.');
      return signIn(found[0].id);
    }
    const u = await one<{ id: number; password_hash: string }>('SELECT id, password_hash FROM users WHERE email = ?', [email]);
    if (!u || !(await bcrypt.compare(password, u.password_hash))) throw new ActionError('Invalid email or password.');
    return signIn(u.id);
  });
}

export async function register(name: string, email: string, password: string): Promise<Result<{ to: string }>> {
  return handle(async () => {
    name = name.trim();
    email = email.trim().toLowerCase();
    if (DEV_LOGIN && password === '') password = DEV_DEFAULT_PASSWORD;
    if (!name || !email || !password) throw new ActionError('Please fill in all fields.');
    maxLen(name, 100, 'Name is too long.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 190) throw new ActionError('Please enter a valid email address.');
    if (password.length < 6) throw new ActionError('Password must be at least 6 characters.');
    if (Buffer.byteLength(password) > 72) throw new ActionError('Password must be at most 72 characters.');
    if (await one('SELECT id FROM users WHERE email = ?', [email])) throw new ActionError('This email is already registered.');
    let id: number;
    try {
      id = (await exec('INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)', [name, email, await bcrypt.hash(password, 10)])).insertId;
    } catch {
      throw new ActionError('This email is already registered.');
    }
    return signIn(id);
  });
}

export async function logout(): Promise<void> {
  (await getSession()).destroy();
  refresh();
}

export async function setLang(lang: Lang): Promise<void> {
  (await cookies()).set('lf-lang', lang === 'ja' ? 'ja' : 'en', { path: '/', maxAge: 60 * 60 * 24 * 365, sameSite: 'lax' });
  refresh();
}

// ---------- membership ----------

export async function requestMembership(organizationId: number): Promise<Result> {
  return handle(async () => {
    const { user } = await requireLogin();
    if (!(await one('SELECT id FROM organizations WHERE id = ?', [organizationId]))) throw new ActionError('Organization not found.');
    if (await one(`SELECT id FROM organization_members WHERE user_id = ? AND organization_id = ? AND status = 'approved'`, [user.id, organizationId]))
      throw new ActionError('You are already a member');
    if (await one(`SELECT id FROM organization_members WHERE user_id = ? AND status = 'pending'`, [user.id]))
      throw new ActionError('Request already sent');
    await exec(`INSERT INTO organization_members (user_id, organization_id, status, role) VALUES (?, ?, 'pending', 'member')`, [user.id, organizationId]);
    refresh();
    return {};
  });
}

export async function membershipStatus(): Promise<Result<{ approved: boolean }>> {
  return handle(async () => {
    const { user } = await requireLogin();
    return { approved: user.membershipStatus === 'approved' };
  });
}

export async function decideMembership(id: number, action: 'approve' | 'reject'): Promise<Result> {
  return handle(async () => {
    const { uid: adminId, orgId } = await requireAdmin();
    if (!['approve', 'reject'].includes(action)) throw new ActionError('Unknown action.');
    const req = await one<{ id: number; user_id: number; organization_id: number; status: string }>(
      'SELECT id, user_id, organization_id, status FROM organization_members WHERE id = ?', [id]);
    // An admin may only decide requests for their own organization.
    if (!req || req.organization_id !== orgId) throw new ActionError('Request not found.');
    if (req.status !== 'pending') throw new ActionError('This request was already handled.');
    await transaction(async conn => {
      if (action === 'approve') {
        // Switching community: the previous approved membership is closed.
        await exec(`UPDATE organization_members SET status = 'left' WHERE user_id = ? AND status = 'approved' AND id <> ?`, [req.user_id, id], conn);
        await exec(`UPDATE organization_members SET status = 'approved', approved_at = NOW(), approved_by = ? WHERE id = ?`, [adminId, id], conn);
      } else {
        await exec(`UPDATE organization_members SET status = 'rejected' WHERE id = ?`, [id], conn);
      }
    });
    refresh();
    return {};
  });
}

// ---------- items ----------

export async function reportItem(fd: FormData): Promise<Result<{ matched: boolean }>> {
  return handle(async () => {
    const { uid, orgId } = await requireMember('Join a community before reporting an item.');
    const kind = str(fd, 'kind') as Kind;
    if (kind !== 'lost' && kind !== 'found') throw new ActionError('Please say whether this was lost or found.');
    const title = str(fd, 'title'), category = str(fd, 'category'), place = str(fd, 'place'), desc = str(fd, 'description');
    if (!title || !category || !place) throw new ActionError('Please fill in the item name, category and place.');
    maxLen(title, 150, 'Item name is too long.');
    maxLen(category, 50, 'Category is too long.');
    maxLen(place, 100, 'Place is too long.');
    maxLen(desc, 2000, 'Description is too long.');
    const itemDate = parseDate(str(fd, 'item_date'));
    const photo = await parsePhoto(fd.get('photo'));

    // A found item is registered right away (status 2, with an item code), so everyone in the community
    // sees it in Found items and can claim it. Staff only record it again if it is brought to the office.
    const id = (await exec(
      `INSERT INTO items (organization_id, reporter_id, kind, title, category, place, item_date, description, photo, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [orgId, uid, kind, title, category, place, itemDate, desc || null, photo, kind === 'found' ? 2 : 1])).insertId;
    if (kind === 'found') await assignCode(id);
    const matched = await matchNewItem(orgId, kind, category, place, itemDate, id);
    refresh();
    return { matched };
  });
}

/** Gives an item its permanent code (e.g. LF-2026-0148) if it has none yet. */
async function assignCode(id: number): Promise<string> {
  const code = (await one<{ item_code: string | null }>('SELECT item_code FROM items WHERE id = ?', [id]))?.item_code;
  if (code) return code;
  const next = `LF-${new Date().getFullYear()}-${String(id).padStart(4, '0')}`;
  await exec('UPDATE items SET item_code = ? WHERE id = ?', [next, id]);
  return next;
}

/** Looks for a match for an item that has none yet and links both sides. Returns whether one was found. */
async function matchNewItem(orgId: number, kind: Kind, category: string, place: string, date: string | null, id: number) {
  const matchId = await findMatchFor(orgId, kind, category, place, date, id);
  if (matchId === null) return false;
  await applyMatch(id, matchId);
  await applyMatch(matchId, id);
  return true;
}

export async function receiveAndRegister(fd: FormData): Promise<Result<{ itemCode: string; shelf: string }>> {
  return handle(async () => {
    const { uid, orgId } = await requireStaff();
    const existingId = Number(fd.get('existing_item_id') ?? 0) || 0;
    const title = str(fd, 'title'), category = str(fd, 'category'), place = str(fd, 'place'), desc = str(fd, 'description');
    const shelf = str(fd, 'shelf'), finder = str(fd, 'finder_name');
    if (!title || !category || !place || !shelf) throw new ActionError('Please fill in the item name, category, place and shelf.');
    maxLen(title, 150, 'Item name is too long.');
    maxLen(category, 50, 'Category is too long.');
    maxLen(place, 100, 'Place is too long.');
    maxLen(shelf, 10, 'Shelf is too long.');
    maxLen(finder, 100, 'Finder name is too long.');
    maxLen(desc, 2000, 'Description is too long.');
    const itemDate = parseDate(str(fd, 'item_date'));
    const photo = await parsePhoto(fd.get('photo'));

    let id: number;
    let alreadyMatched = false;
    if (existingId > 0) {
      // A member's found item was brought to the office: record where it is stored now.
      const item = await one<{ organization_id: number; kind: Kind; status: number; received_at: string | null; matched_item_id: number | null }>(
        'SELECT organization_id, kind, status, received_at, matched_item_id FROM items WHERE id = ?', [existingId]);
      if (!item || item.organization_id !== orgId || item.kind !== 'found') throw new ActionError('Item not found.');
      if (item.received_at || item.status >= 5) throw new ActionError('This item was already received.');
      // Keep the member's photo unless staff attach a new one.
      await exec(
        `UPDATE items SET title=?, category=?, place=?, item_date=?, description=?, shelf=?, finder_name=?,
         status=GREATEST(status, 2), received_by=?, received_at=NOW()${photo === null ? '' : ', photo=?'} WHERE id=?`,
        [title, category, place, itemDate, desc || null, shelf, finder || null, uid, ...(photo === null ? [] : [photo]), existingId]);
      id = existingId;
      alreadyMatched = item.matched_item_id !== null;
    } else {
      // Someone handed an item in at the office.
      id = (await exec(
        `INSERT INTO items (organization_id, reporter_id, kind, title, category, place, item_date, description, photo, shelf, finder_name, status, received_by, received_at)
         VALUES (?, ?, 'found', ?, ?, ?, ?, ?, ?, ?, ?, 2, ?, NOW())`,
        [orgId, uid, title, category, place, itemDate, desc || null, photo, shelf, finder || null, uid])).insertId;
    }
    const code = await assignCode(id);
    if (!alreadyMatched) await matchNewItem(orgId, 'found', category, place, itemDate, id);
    refresh();
    return { itemCode: code, shelf };
  });
}

export async function scanItem(rawCode: string): Promise<Result<{ item: ScannedItem }>> {
  return handle(async () => {
    const { orgId } = await requireStaff();
    const code = rawCode.trim().toUpperCase();
    if (!code) throw new ActionError('Please enter an item code.');
    const r = await one<Record<string, unknown>>(
      `SELECT i.id, i.kind, i.title, i.category, i.place, i.item_date, i.description, i.status,
              i.item_code, i.shelf, i.finder_name, i.received_at, (i.photo IS NOT NULL) AS has_photo,
              ru.name AS reporter_name, hu.name AS received_by_name
       FROM items i
       JOIN users ru ON ru.id = i.reporter_id
       LEFT JOIN users hu ON hu.id = i.received_by
       WHERE i.item_code = ? AND i.organization_id = ?`, [code, orgId]);
    if (!r) throw new ActionError(`Nothing matches “${code}”. Check the label and try again.`);
    return {
      item: {
        id: Number(r.id), kind: r.kind as Kind, title: String(r.title), category: String(r.category),
        place: String(r.place), date: (r.item_date as string) ?? null, description: (r.description as string) ?? null,
        status: Number(r.status) as ItemStatus, itemCode: String(r.item_code), shelf: (r.shelf as string) ?? null,
        finderName: (r.finder_name as string) ?? null, receivedAt: (r.received_at as string) ?? null,
        hasPhoto: Boolean(Number(r.has_photo)), reporterName: String(r.reporter_name),
        receivedByName: (r.received_by_name as string) ?? null,
      },
    };
  });
}

// ---------- claims ----------

export async function requestClaim(foundItemId: number, rawAnswers: string): Promise<Result> {
  return handle(async () => {
    const { uid, orgId } = await requireMember();
    const answers = rawAnswers.trim();
    if (!answers) throw new ActionError('Please answer the verification questions.');
    maxLen(answers, 1000, 'Answer is too long.');
    const found = await one<{ id: number; organization_id: number; reporter_id: number; kind: Kind; status: number; matched_item_id: number | null }>(
      'SELECT id, organization_id, reporter_id, kind, status, matched_item_id FROM items WHERE id = ?', [foundItemId]);
    if (!found || found.organization_id !== orgId || found.kind !== 'found') throw new ActionError('Item not found.');
    if (found.reporter_id === uid) throw new ActionError('You posted this item, so you cannot claim it.');
    if (found.status < 2) throw new ActionError('This item is not registered yet.');
    if (found.status >= 5) throw new ActionError('This item has already been returned.');
    if (await one(`SELECT id FROM claims WHERE found_item_id = ? AND claimant_id = ? AND status IN ('pending','approved')`, [foundItemId, uid]))
      throw new ActionError('You already sent a claim for this item.');
    // If the system had already suggested this found item to one of the claimant's own lost reports, link it.
    const lost = await one<{ id: number }>(`SELECT id FROM items WHERE id = ? AND reporter_id = ? AND kind = 'lost'`, [found.matched_item_id ?? 0, uid]);
    await exec('INSERT INTO claims (found_item_id, lost_item_id, claimant_id, answers) VALUES (?, ?, ?, ?)', [foundItemId, lost?.id ?? null, uid, answers]);
    await exec('UPDATE items SET status = GREATEST(status, 3) WHERE id = ?', [foundItemId]);
    refresh();
    return {};
  });
}

async function findClaim(id: number, orgId: number) {
  const c = await one<{ id: number; status: string; found_item_id: number; lost_item_id: number | null; organization_id: number; pickup_code: string | null }>(
    `SELECT c.id, c.status, c.found_item_id, c.lost_item_id, c.pickup_code, i.organization_id
     FROM claims c JOIN items i ON i.id = c.found_item_id WHERE c.id = ?`, [id]);
  if (!c || c.organization_id !== orgId) throw new ActionError('Claim not found.');
  return c;
}

export async function decideClaim(id: number, action: 'approve' | 'reject'): Promise<Result> {
  return handle(async () => {
    const { uid: staffId, orgId } = await requireStaff();
    if (!['approve', 'reject'].includes(action)) throw new ActionError('Unknown action.');
    const c = await findClaim(id, orgId);
    if (c.status !== 'pending') throw new ActionError('This claim was already handled.');
    await transaction(async conn => {
      // An approved claim gets a 6-digit pickup code. The owner sees it on their pickup pass and tells it to staff.
      const code = action === 'approve' ? String(randomInt(0, 1_000_000)).padStart(6, '0') : null;
      await exec('UPDATE claims SET status = ?, decided_at = NOW(), decided_by = ?, pickup_code = ? WHERE id = ?',
        [action === 'approve' ? 'approved' : 'rejected', staffId, code, id], conn);
      if (action === 'approve') {
        await exec('UPDATE items SET status = 4 WHERE id = ?', [c.found_item_id], conn);
        if (c.lost_item_id) await exec('UPDATE items SET status = 4 WHERE id = ?', [c.lost_item_id], conn);
      } else {
        // Reopen the found item for other claimants, and let the lost report be matched again.
        const stillClaimed = await one(`SELECT id FROM claims WHERE found_item_id = ? AND status IN ('pending','approved')`, [c.found_item_id], conn);
        if (!stillClaimed) await exec('UPDATE items SET status = 2 WHERE id = ?', [c.found_item_id], conn);
        if (c.lost_item_id) await exec('UPDATE items SET status = 1, matched_item_id = NULL WHERE id = ?', [c.lost_item_id], conn);
      }
    });
    refresh();
    return {};
  });
}

export async function handoverClaim(id: number, idType: string, pickupCode: string): Promise<Result> {
  return handle(async () => {
    const { uid: staffId, orgId } = await requireStaff();
    idType = idType.trim();
    if (!idType) throw new ActionError('Please select the ID shown.');
    const c = await findClaim(id, orgId);
    if (c.status !== 'approved') throw new ActionError('This claim is not ready for handover.');
    // Claims approved before pickup codes existed have none; for those the ID check alone is enough.
    if (c.pickup_code && pickupCode.replace(/\D/g, '') !== c.pickup_code)
      throw new ActionError('The pickup code does not match. Ask the owner to open their pickup pass.');
    await transaction(async conn => {
      await exec(`UPDATE claims SET status = 'returned', returned_at = NOW(), returned_by = ?, id_type = ? WHERE id = ?`, [staffId, idType, id], conn);
      await exec('UPDATE items SET status = 5 WHERE id = ?', [c.found_item_id], conn);
      if (c.lost_item_id) await exec('UPDATE items SET status = 5 WHERE id = ?', [c.lost_item_id], conn);
    });
    refresh();
    return {};
  });
}

/** The finder says they handed their found item to the office. Staff confirm it later (adds the shelf). */
export async function handToOffice(itemId: number): Promise<Result> {
  return handle(async () => {
    const { uid, orgId } = await requireMember();
    const it = await one<{ organization_id: number; reporter_id: number; kind: Kind; status: number; received_at: string | null; handed_in_at: string | null }>(
      'SELECT organization_id, reporter_id, kind, status, received_at, handed_in_at FROM items WHERE id = ?', [itemId]);
    if (!it || it.organization_id !== orgId || it.reporter_id !== uid || it.kind !== 'found') throw new ActionError('Item not found.');
    if (it.received_at || it.status >= 5) throw new ActionError('This item is already at the office.');
    if (it.handed_in_at) throw new ActionError('You already handed this item to the office.');
    await exec('UPDATE items SET handed_in_at = NOW() WHERE id = ?', [itemId]);
    refresh();
    return {};
  });
}

/** Close a found item without its owner (handed to police, donated, ...). Status 6, kept for the records. */
export async function closeItem(itemId: number, method: string, note: string): Promise<Result> {
  return handle(async () => {
    const { uid, orgId } = await requireStaff();
    method = method.trim();
    note = note.trim();
    if (!DISPOSAL_METHODS.includes(method)) throw new ActionError('Please choose how the item left the office.');
    maxLen(note, 255, 'Note is too long.');
    const it = await one<{ organization_id: number; kind: Kind; status: number }>('SELECT organization_id, kind, status FROM items WHERE id = ?', [itemId]);
    if (!it || it.organization_id !== orgId || it.kind !== 'found') throw new ActionError('Item not found.');
    if (it.status >= 5) throw new ActionError('This item is already closed.');
    if (await one(`SELECT id FROM claims WHERE found_item_id = ? AND status IN ('pending','approved')`, [itemId]))
      throw new ActionError('This item has an open claim. Decide the claim first.');
    await transaction(async conn => {
      await exec(`UPDATE items SET status = 6, disposed_at = NOW(), disposal_method = ?, disposal_note = ?, disposed_by = ? WHERE id = ?`,
        [method, note || null, uid, itemId], conn);
      // A lost report that was matched to it goes back to waiting.
      await exec(`UPDATE items SET matched_item_id = NULL, matched_at = NULL, status = 1 WHERE matched_item_id = ? AND kind = 'lost' AND status < 4`, [itemId], conn);
    });
    refresh();
    return {};
  });
}

// ---------- matches ----------

/** "Not mine" / "Not a match": unlinks a suggested match. The owner of the lost report or staff may do this. */
export async function rejectMatch(lostId: number): Promise<Result> {
  return handle(async () => {
    const { user } = await requireLogin();
    const lost = await one<{ id: number; organization_id: number; reporter_id: number; kind: Kind; status: number; matched_item_id: number | null }>(
      'SELECT id, organization_id, reporter_id, kind, status, matched_item_id FROM items WHERE id = ?', [lostId]);
    const isStaff = ['staff', 'admin'].includes(user.role);
    if (!lost || lost.kind !== 'lost' || lost.organization_id !== user.organizationId || (!isStaff && lost.reporter_id !== user.id))
      throw new ActionError('Item not found.');
    if (!lost.matched_item_id) throw new ActionError('This match was already removed.');
    if (lost.status >= 4) throw new ActionError('This match is already being claimed.');
    const foundId = lost.matched_item_id;
    await transaction(async conn => {
      await exec('UPDATE items SET matched_item_id = NULL, matched_at = NULL, status = 1 WHERE id = ?', [lostId], conn);
      // The found item goes back to "at the office" unless someone has an open claim on it.
      const claimed = await one(`SELECT id FROM claims WHERE found_item_id = ? AND status IN ('pending','approved')`, [foundId], conn);
      await exec(
        `UPDATE items SET matched_item_id = IF(matched_item_id = ?, NULL, matched_item_id)${claimed ? '' : ', status = IF(status = 3, 2, status)'} WHERE id = ?`,
        [lostId, foundId], conn);
    });
    refresh();
    return {};
  });
}

/** Staff link a lost report and a found item by hand. */
export async function linkMatch(lostId: number, foundId: number): Promise<Result> {
  return handle(async () => {
    const { orgId } = await requireStaff();
    const get = (id: number) => one<{ organization_id: number; kind: Kind; status: number; matched_item_id: number | null }>(
      'SELECT organization_id, kind, status, matched_item_id FROM items WHERE id = ?', [id]);
    const [lost, found] = await Promise.all([get(lostId), get(foundId)]);
    if (!lost || lost.organization_id !== orgId || lost.kind !== 'lost' || !found || found.organization_id !== orgId || found.kind !== 'found')
      throw new ActionError('Item not found.');
    if (lost.matched_item_id || found.matched_item_id) throw new ActionError('One of these items is already matched.');
    if (lost.status !== 1 || found.status !== 2) throw new ActionError('Only open lost reports and unclaimed found items can be linked.');
    await transaction(async conn => {
      await applyMatch(lostId, foundId, conn);
      await applyMatch(foundId, lostId, conn);
    });
    refresh();
    return {};
  });
}

// ---------- people ----------

async function findMembership(membershipId: number, orgId: number, adminId: number) {
  const m = await one<{ user_id: number; organization_id: number; status: string }>(
    'SELECT user_id, organization_id, status FROM organization_members WHERE id = ?', [membershipId]);
  if (!m || m.organization_id !== orgId || m.status !== 'approved') throw new ActionError('Member not found.');
  if (m.user_id === adminId) throw new ActionError('You cannot change your own access.');
  return m;
}

export async function setMemberRole(membershipId: number, role: string): Promise<Result> {
  return handle(async () => {
    const { uid, orgId } = await requireAdmin();
    if (!['member', 'staff', 'admin'].includes(role)) throw new ActionError('Unknown role.');
    await findMembership(membershipId, orgId, uid);
    await exec('UPDATE organization_members SET role = ? WHERE id = ?', [role, membershipId]);
    refresh();
    return {};
  });
}

export async function removeMember(membershipId: number): Promise<Result> {
  return handle(async () => {
    const { uid, orgId } = await requireAdmin();
    await findMembership(membershipId, orgId, uid);
    await exec(`UPDATE organization_members SET status = 'left' WHERE id = ?`, [membershipId]);
    refresh();
    return {};
  });
}

// ---------- profile ----------

export async function changePassword(current: string, next: string): Promise<Result> {
  return handle(async () => {
    const { user } = await requireLogin();
    if (!current || !next) throw new ActionError('Please fill in all fields.');
    if (next.length < 6) throw new ActionError('Password must be at least 6 characters.');
    if (Buffer.byteLength(next) > 72) throw new ActionError('Password must be at most 72 characters.');
    const u = await one<{ password_hash: string }>('SELECT password_hash FROM users WHERE id = ?', [user.id]);
    if (!u || !(await bcrypt.compare(current, u.password_hash))) throw new ActionError('Current password is wrong.');
    await exec('UPDATE users SET password_hash = ? WHERE id = ?', [await bcrypt.hash(next, 10), user.id]);
    return {};
  });
}

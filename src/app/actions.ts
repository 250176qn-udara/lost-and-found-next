'use server';

// All writes go through these Server Actions (they replace the POST actions of api/index.php).
// Next.js checks the Origin header of every Server Action, which replaces the old CSRF token.

import bcrypt from 'bcryptjs';
import { randomInt, randomBytes } from 'node:crypto';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { handle, maxLen, parseDate, parsePhoto, str, type Result } from '@/lib/action';
import { ActionError, getSession, loadState, requireAdmin, requireLogin, requireMember, requireStaff, requireSuper, startPath } from '@/lib/auth';
import { APP_URL, sendMail } from '@/lib/mail';
import { all, exec, one, transaction } from '@/lib/db';
import { DEV_DEFAULT_PASSWORD, DEV_LOGIN } from '@/lib/devlogin';
import { DISPOSAL_METHODS, NOTIFY_EVENTS, ORG_TYPES, SETTING_LIMITS, type NotifyPrefs } from '@/lib/constants';
import { CARD_DESIGNS, GIFT_AMOUNTS, GIFT_BRANDS, THANKS_REACTIONS } from '@/lib/gifts';
import { giftProviderReady, issueGiftCode } from '@/lib/gift-provider';
import { charge, refund } from '@/lib/payjp';
import { emailStaff, emailUser, savePrefs } from '@/lib/prefs';
import { applyMatch, findMatch } from '@/lib/items';
import { describePhotoWithGemini, geminiReady, imagePart, type PhotoGuess } from '@/lib/gemini';
import { getOrgSettings } from '@/lib/settings';
import { getLang } from '@/lib/i18n-server';
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
      const found = await all<{ id: number }>('SELECT id FROM users WHERE (email = ? OR LOWER(name) = ?) AND deleted_at IS NULL LIMIT 2', [email, email]);
      if (found.length === 0) throw new ActionError('No account with this name or email.');
      if (found.length > 1) throw new ActionError('More than one account has this name. Use the email instead.');
      return signIn(found[0].id);
    }
    const u = await one<{ id: number; password_hash: string }>('SELECT id, password_hash FROM users WHERE email = ? AND deleted_at IS NULL', [email]);
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
    const pin = await parsePin(fd, orgId, place);

    // A found item is registered right away (status 2, with an item code), so everyone in the community
    // sees it in Found items and can claim it. Staff only record it again if it is brought to the office.
    const id = (await exec(
      `INSERT INTO items (organization_id, reporter_id, kind, title, category, place, lat, lng, item_date, description, photo, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [orgId, uid, kind, title, category, place, pin.lat, pin.lng, itemDate, desc || null, photo, kind === 'found' ? 2 : 1])).insertId;
    if (kind === 'found') await assignCode(id);
    const matched = await matchNewItem(orgId, kind, category, place, itemDate, id, pin);
    if (kind === 'found') await emailStaff(orgId, 'items', {
      subject: ['拾得物が投稿されました', 'A member posted a found item'],
      ja: [`会員が拾得物「${title}」（${place}）を投稿しました。`], en: [`A member posted a found item: "${title}" (${place}).`],
      path: `/items/${id}`,
    }, uid);
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
async function matchNewItem(orgId: number, kind: Kind, category: string, place: string, date: string | null, id: number, pin: Pin) {
  const m = await findMatch(orgId, kind, category, place, date, id, pin);
  if (m === null) return false;
  const matchId = m.id;
  const ai = { score: m.aiScore, reason: m.aiReason };
  await applyMatch(id, matchId, undefined, ai);
  await applyMatch(matchId, id, undefined, ai);
  await mailMatch(kind === 'lost' ? id : matchId);
  return true;
}

/** Tells the owner of a lost report that a found item may be theirs. */
async function mailMatch(lostId: number) {
  const r = await one<{ reporter_id: number; title: string }>('SELECT reporter_id, title FROM items WHERE id = ?', [lostId]);
  if (!r) return;
  await emailUser(r.reporter_id, 'matches', {
    subject: ['落とし物が見つかったかもしれません', 'We may have found your item'],
    ja: [`届け出た「${r.title}」に似た拾得物が見つかりました。`, 'アプリで確認し、自分の物なら「これは私のものです」を押してください。'],
    en: [`A found item looks like the "${r.title}" you reported.`, 'Check it in the app and press "This is mine" if it is yours.'],
    path: '/my-items',
  });
}

/** "Fill in from photo": Gemini looks at the photo and suggests the form fields. Nothing is saved. */
export async function suggestFromPhoto(fd: FormData): Promise<Result<{ guess: PhotoGuess }>> {
  return handle(async () => {
    const { orgId } = await requireMember();
    if (!geminiReady()) throw new ActionError('AI is not set up. Ask the administrator to add a Gemini API key.');
    const part = imagePart(await parsePhoto(fd.get('photo')));
    if (!part) throw new ActionError('Please choose a photo.');
    const [{ categories }, lang] = await Promise.all([getOrgSettings(orgId), getLang()]);
    try {
      const guess = await describePhotoWithGemini(part, categories);
      return { guess: { ...guess, title: lang === 'ja' && guess.titleJa ? guess.titleJa : guess.title } };
    } catch (e) {
      console.error('[gemini] photo', e);
      throw new ActionError('The AI could not read this photo right now. Please fill in the form yourself.');
    }
  });
}

export async function receiveAndRegister(fd: FormData): Promise<Result<{ id: number; itemCode: string; shelf: string }>> {
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
    const pin = await parsePin(fd, orgId, place);

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
        `UPDATE items SET title=?, category=?, place=?, lat=?, lng=?, item_date=?, description=?, shelf=?, finder_name=?,
         status=GREATEST(status, 2), received_by=?, received_at=NOW()${photo === null ? '' : ', photo=?'} WHERE id=?`,
        [title, category, place, pin.lat, pin.lng, itemDate, desc || null, shelf, finder || null, uid, ...(photo === null ? [] : [photo]), existingId]);
      id = existingId;
      alreadyMatched = item.matched_item_id !== null;
    } else {
      // Someone handed an item in at the office.
      id = (await exec(
        `INSERT INTO items (organization_id, reporter_id, kind, title, category, place, lat, lng, item_date, description, photo, shelf, finder_name, status, received_by, received_at)
         VALUES (?, ?, 'found', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 2, ?, NOW())`,
        [orgId, uid, title, category, place, pin.lat, pin.lng, itemDate, desc || null, photo, shelf, finder || null, uid])).insertId;
    }
    const code = await assignCode(id);
    if (!alreadyMatched) await matchNewItem(orgId, 'found', category, place, itemDate, id, pin);
    refresh();
    return { id, itemCode: code, shelf };
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
              ru.name AS reporter_name, hu.name AS received_by_name,
              EXISTS(SELECT 1 FROM claims c WHERE c.found_item_id = i.id AND c.status = 'approved') AS pickup_ready
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
        receivedByName: (r.received_by_name as string) ?? null, pickupReady: Boolean(Number(r.pickup_ready)),
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
    const title = (await one<{ title: string }>('SELECT title FROM items WHERE id = ?', [foundItemId]))?.title ?? '';
    // The finder is not told who claimed it.
    await emailUser(found.reporter_id, 'claims', {
      subject: ['あなたが届けた物に請求がありました', 'Someone claimed the item you found'],
      ja: [`あなたが届けた「${title}」に、持ち主と名乗る人から請求がありました。事務所が確認します。`],
      en: [`Someone says the "${title}" you found is theirs. The office will check their answers.`],
      path: `/items/${foundItemId}`,
    });
    await emailStaff(orgId, 'claims', {
      subject: ['確認待ちの請求があります', 'A claim is waiting for verification'],
      ja: [`「${title}」に新しい請求があります。回答を確認してください。`], en: [`There is a new claim for "${title}". Please check the answers.`],
      path: '/desk',
    }, found.reporter_id);
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
    if (action === 'approve') await thankFinder(id, c.found_item_id, staffId);
    await mailDecision(id);
    refresh();
    return {};
  });
}

/** Tells the claimant the decision. An approval includes the pickup code (only they receive it). */
async function mailDecision(claimId: number) {
  const c = await one<{ claimant_id: number; status: string; pickup_code: string | null; title: string; at_office: number }>(
    `SELECT c.claimant_id, c.status, c.pickup_code, i.title, (i.received_at IS NOT NULL) AS at_office
     FROM claims c JOIN items i ON i.id = c.found_item_id WHERE c.id = ?`, [claimId]);
  if (!c) return;
  if (c.status === 'approved') {
    const ready = Number(c.at_office) === 1;
    await emailUser(c.claimant_id, 'claims', {
      subject: ['請求が承認されました：受け取りコード', 'Claim approved — your pickup code'],
      ja: [`「${c.title}」があなたの物だと確認できました。`, `受け取りコード：${c.pickup_code}`,
        ready ? '写真付きの身分証を持って事務所へお越しください。このコードを職員に伝えてください。'
              : '拾い主が事務所に届けたら、アプリでお知らせします。その後、写真付きの身分証とこのコードを持って事務所へお越しください。'],
      en: [`We confirmed that the "${c.title}" is yours.`, `Pickup code: ${c.pickup_code}`,
        ready ? 'Come to the office with a photo ID and tell the staff this code.'
              : 'We will tell you in the app when the finder has brought it to the office. Then come with a photo ID and this code.'],
      path: '/my-items?tab=claims',
    });
  } else if (c.status === 'rejected') {
    await emailUser(c.claimant_id, 'claims', {
      subject: ['請求の結果', 'About your claim'],
      ja: [`「${c.title}」への請求は、回答が登録内容と一致しなかったため承認されませんでした。`, '別の物の可能性があります。落とし物の届け出は引き続き探されます。'],
      en: [`Your claim for the "${c.title}" was not approved because the answers did not match.`, 'It may be a different item. Your lost report is still being matched.'],
      path: '/my-items',
    });
  }
}

/**
 * The owner was confirmed but the finder still has the item: thank the finder and ask them to bring it to the office.
 * The in-app notification comes from the data itself; this sends the email. The owner's identity is never included.
 */
async function thankFinder(claimId: number, foundItemId: number, staffId: number) {
  const r = await one<{ title: string; item_code: string | null; received_at: string | null; handed_in_at: string | null; finder_id: number; claimant_id: number; org: string; org_id: number }>(
    `SELECT i.title, i.item_code, i.received_at, i.handed_in_at, i.reporter_id AS finder_id, c.claimant_id, o.name AS org, o.id AS org_id
     FROM items i JOIN claims c ON c.id = ? JOIN organizations o ON o.id = i.organization_id
     WHERE i.id = ?`, [claimId, foundItemId]);
  if (!r || r.received_at || r.handed_in_at || r.finder_id === r.claimant_id) return; // already at (or brought to) the office, or nobody else to thank
  const code = r.item_code ?? '—';
  // A chat message from the office (in the app), and the same thanks by email.
  await postOfficeMessage(r.org_id, r.finder_id, staffId, true, [
    `ご協力ありがとうございます！あなたが見つけた「${r.title}」の持ち主が確認できました。事務所（受付）へお届けいただき、アイテムコード ${code} をお伝えください。`,
    '',
    `Thank you for your help! The owner of the "${r.title}" you found has been confirmed. Please bring it to the office and tell the staff the item code ${code}.`,
  ].join('\n'), foundItemId);
  await emailUser(r.finder_id, 'claims', {
    subject: ['ありがとうございます：事務所へお届けください', 'Thank you — please bring the item to the office'],
    ja: [`あなたが見つけてくださった「${r.title}」の持ち主が確認できました。ご協力ありがとうございます。`,
      `お手数ですが、${r.org}の事務所（受付）へお届けください。受付でアイテムコード ${code} をお伝えください。`,
      'お届けの後、アプリのアイテムページで「事務所に届ける」を押してください。'],
    en: [`The owner of the "${r.title}" you found has been confirmed. Thank you for your help!`,
      `Please bring it to the office (front desk) of ${r.org} and tell the staff the item code ${code}.`,
      'After handing it in, press "Hand over to the office" on the item page in the app:'],
    path: `/items/${foundItemId}`,
  });
}

export async function handoverClaim(id: number, idType: string, pickupCode: string): Promise<Result> {
  return handle(async () => {
    const { uid: staffId, orgId } = await requireStaff();
    idType = idType.trim();
    if (!idType) throw new ActionError('Please select the ID shown.');
    const c = await findClaim(id, orgId);
    if (c.status !== 'approved') throw new ActionError('This claim is not ready for handover.');
    // The owner must tell the code shown on their pickup pass. A claim approved before codes existed gets one now.
    if (!c.pickup_code) {
      await exec('UPDATE claims SET pickup_code = ? WHERE id = ?', [String(randomInt(0, 1_000_000)).padStart(6, '0'), id]);
      refresh();
      throw new ActionError('A pickup code was just sent to the owner. Ask them to open their pickup pass and tell you the code.');
    }
    if (pickupCode.replace(/\D/g, '') !== c.pickup_code)
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
    const title = (await one<{ title: string }>('SELECT title FROM items WHERE id = ?', [itemId]))?.title ?? '';
    await emailStaff(orgId, 'items', {
      subject: ['拾得物が事務所に届けられました', 'A finder handed in an item'],
      ja: [`拾い主が「${title}」を事務所に届けたと連絡しました。受け取りを確認して、棚を登録してください。`],
      en: [`A finder says they handed "${title}" to the office. Please confirm it and add a shelf.`],
      path: '/desk?tab=finders',
    }, uid);
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

type Pin = { lat: number | null; lng: number | null };

/** Map pin from the form (lat/lng), or else the pin of the organization's place with that name. */
async function parsePin(fd: FormData, orgId: number, place: string): Promise<Pin> {
  const lat = Number(str(fd, 'lat')), lng = Number(str(fd, 'lng'));
  if (str(fd, 'lat') !== '' && str(fd, 'lng') !== '') {
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) throw new ActionError('The map pin is not valid.');
    return { lat: Math.round(lat * 1e6) / 1e6, lng: Math.round(lng * 1e6) / 1e6 };
  }
  const p = await one<{ lat: string | null; lng: string | null }>('SELECT lat, lng FROM places WHERE organization_id = ? AND name = ?', [orgId, place]);
  return { lat: p?.lat == null ? null : Number(p.lat), lng: p?.lng == null ? null : Number(p.lng) };
}

// ---------- places (admins) ----------

function checkPlace(name: string, lat: number | null, lng: number | null) {
  if (!name) throw new ActionError('Please enter the place name.');
  maxLen(name, 100, 'Place is too long.');
  if ((lat === null) !== (lng === null)) throw new ActionError('The map pin is not valid.');
  if (lat !== null && (!Number.isFinite(lat) || !Number.isFinite(lng!) || Math.abs(lat) > 90 || Math.abs(lng!) > 180)) throw new ActionError('The map pin is not valid.');
}

export async function savePlace(id: number, rawName: string, lat: number | null, lng: number | null): Promise<Result> {
  return handle(async () => {
    const { orgId } = await requireAdmin();
    const name = rawName.trim();
    checkPlace(name, lat, lng);
    if (await one('SELECT id FROM places WHERE organization_id = ? AND name = ? AND id <> ?', [orgId, name, id || 0]))
      throw new ActionError('This place is already on the list.');
    if (id) {
      const p = await one<{ organization_id: number; name: string }>('SELECT organization_id, name FROM places WHERE id = ?', [id]);
      if (!p || p.organization_id !== orgId) throw new ActionError('Place not found.');
      await transaction(async conn => {
        await exec('UPDATE places SET name = ?, lat = ?, lng = ? WHERE id = ?', [name, lat, lng, id], conn);
        // Items that used the old name follow the rename.
        if (p.name !== name) await exec('UPDATE items SET place = ? WHERE organization_id = ? AND place = ?', [name, orgId, p.name], conn);
      });
    } else {
      await exec('INSERT INTO places (organization_id, name, lat, lng) VALUES (?, ?, ?, ?)', [orgId, name, lat, lng]);
    }
    refresh();
    return {};
  });
}

export async function deletePlace(id: number): Promise<Result> {
  return handle(async () => {
    const { orgId } = await requireAdmin();
    const p = await one<{ organization_id: number }>('SELECT organization_id FROM places WHERE id = ?', [id]);
    if (!p || p.organization_id !== orgId) throw new ActionError('Place not found.');
    await exec('DELETE FROM places WHERE id = ?', [id]); // items keep their place name and pin
    refresh();
    return {};
  });
}

// ---------- thank-you letters ----------

/**
 * The owner thanks the finder after the item was returned. The letter is required; an e-gift is optional and is
 * paid by card through PAY.JP (the browser sends only a card token). If anything fails after the charge, it is refunded.
 */
export async function sendThanks(claimId: number, input: {
  message: string; card: string; showName: boolean; gift?: { brand: string; amount: number; token: string } | null;
}): Promise<Result> {
  return handle(async () => {
    const { uid } = await requireMember();
    const message = input.message.trim();
    if (!message) throw new ActionError('Please write a thank-you message.');
    maxLen(message, 1000, 'The message is too long.');
    if (!(CARD_DESIGNS as readonly string[]).includes(input.card)) throw new ActionError('Please choose a card.');
    const c = await one<{ status: string; claimant_id: number; finder: number; title: string; item_code: string | null }>(
      `SELECT c.status, c.claimant_id, i.reporter_id AS finder, i.title, i.item_code
       FROM claims c JOIN items i ON i.id = c.found_item_id WHERE c.id = ?`, [claimId]);
    if (!c || c.claimant_id !== uid) throw new ActionError('Claim not found.');
    if (c.status !== 'returned') throw new ActionError('You can send thanks after you got the item back.');
    if (c.finder === uid) throw new ActionError('Claim not found.');
    if (await one('SELECT id FROM thanks WHERE claim_id = ?', [claimId])) throw new ActionError('You already sent thanks for this item.');

    let chargeId: string | null = null, code: string | null = null, brand: string | null = null, amount: number | null = null;
    const gift = input.gift ?? null;
    if (gift) {
      if (!GIFT_BRANDS.some(b => b.key === gift.brand) || !GIFT_AMOUNTS.includes(gift.amount)) throw new ActionError('Please choose a gift.');
      if (!gift.token) throw new ActionError('Please enter your card.');
      if (!giftProviderReady()) throw new ActionError('Gift cards are not available yet. You can still send the letter.');
      brand = gift.brand; amount = gift.amount;
      chargeId = await charge(amount, gift.token, `Thank-you gift ${brand} ¥${amount} for ${c.item_code ?? c.title}`);
    }
    try {
      if (chargeId) code = await issueGiftCode(brand!, amount!);
      await exec(
        `INSERT INTO thanks (claim_id, from_user, to_user, message, card, show_name, gift_brand, gift_amount, gift_code, charge_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [claimId, uid, c.finder, message, input.card, input.showName ? 1 : 0, brand, amount, code, chargeId]);
    } catch (e) {
      if (chargeId) await refund(chargeId).catch(err => console.error('Refund failed for', chargeId, err));
      throw e instanceof ActionError ? e : new ActionError('Your thanks could not be saved. Any payment was refunded.');
    }
    const brandName = GIFT_BRANDS.find(b => b.key === brand)?.name ?? brand;
    await emailUser(c.finder, 'thanks', {
      subject: code ? ['お礼の手紙とギフトが届きました', 'You received a thank-you letter and a gift'] : ['お礼の手紙が届きました', 'You received a thank-you letter'],
      ja: [`あなたが見つけた「${c.title}」の持ち主から、お礼の手紙が届きました。`,
        ...(code ? [`${brandName} ¥${amount} のe-ギフトも届いています。ギフトコード：${code}`] : []), 'アプリで手紙を読めます。'],
      en: [`The owner of the "${c.title}" you found sent you a thank-you letter.`,
        ...(code ? [`They also sent you a ${brandName} ¥${amount} e-gift. Gift code: ${code}`] : []), 'Read the letter in the app:'],
      path: '/my-items?tab=thanks',
    });
    refresh();
    return {};
  });
}

/** The finder reacts to a letter they received (tap the same reaction again to remove it). */
export async function reactToThanks(id: number, reaction: string | null): Promise<Result> {
  return handle(async () => {
    const { uid } = await requireMember();
    if (reaction !== null && !(THANKS_REACTIONS as readonly string[]).includes(reaction)) throw new ActionError('Unknown reaction.');
    const r = await exec(
      'UPDATE thanks SET reaction = ?, reacted_at = IF(? IS NULL, NULL, NOW()), read_at = COALESCE(read_at, NOW()) WHERE id = ? AND to_user = ?',
      [reaction, reaction, id, uid]);
    if (!r.affectedRows) throw new ActionError('Letter not found.');
    refresh();
    return {};
  });
}

/** The finder opened a letter. */
export async function markThanksRead(id: number): Promise<void> {
  const { uid } = await requireMember();
  await exec('UPDATE thanks SET read_at = COALESCE(read_at, NOW()) WHERE id = ? AND to_user = ?', [id, uid]);
}

// ---------- organization settings (admins) ----------

async function ensureSettingsRow(orgId: number) {
  await exec('INSERT IGNORE INTO org_settings (organization_id) VALUES (?)', [orgId]);
}

export async function saveGeneralSettings(input: { storageDays: number; policeDays: number; hideSensitive: boolean }): Promise<Result> {
  return handle(async () => {
    const { orgId } = await requireAdmin();
    const storage = Number(input.storageDays), police = Number(input.policeDays);
    if (!SETTING_LIMITS.storageDays.includes(storage)) throw new ActionError('Please choose a storage period.');
    if (!Number.isInteger(police) || police < SETTING_LIMITS.policeDays.min || police > SETTING_LIMITS.policeDays.max)
      throw new ActionError('The police deadline must be between 1 and 14 days.');
    if (police > storage) throw new ActionError('The police deadline cannot be longer than the storage period.');
    await ensureSettingsRow(orgId);
    await exec('UPDATE org_settings SET storage_days = ?, police_days = ?, hide_sensitive = ? WHERE organization_id = ?',
      [storage, police, input.hideSensitive ? 1 : 0, orgId]);
    refresh();
    return {};
  });
}

/** Saves a whole list (categories, shelves or ID types). Items that use a removed value keep it. */
export async function saveSettingList(kind: 'categories' | 'shelves' | 'idTypes', values: string[]): Promise<Result> {
  return handle(async () => {
    const { orgId } = await requireAdmin();
    const column = { categories: 'categories', shelves: 'shelves', idTypes: 'id_types' }[kind];
    if (!column) throw new ActionError('Unknown setting.');
    const clean = values.map(v => String(v).trim()).filter(Boolean);
    if (!clean.length) throw new ActionError('Keep at least one entry.');
    if (clean.length > SETTING_LIMITS.listMax) throw new ActionError('This list is too long.');
    if (clean.some(v => [...v].length > (kind === 'shelves' ? SETTING_LIMITS.shelfMax : SETTING_LIMITS.itemMax))) throw new ActionError('One of the names is too long.');
    if (new Set(clean.map(v => v.toLowerCase())).size !== clean.length) throw new ActionError('This name is already on the list.');
    await ensureSettingsRow(orgId);
    await exec(`UPDATE org_settings SET ${column} = ? WHERE organization_id = ?`, [JSON.stringify(clean), orgId]);
    refresh();
    return {};
  });
}

// ---------- notifications and privacy (each user) ----------

export async function markNoticesRead(ids: string[]): Promise<void> {
  const { user } = await requireLogin();
  const clean = [...new Set(ids)].filter(id => typeof id === 'string' && /^[a-z0-9-: ]{1,64}$/i.test(id)).slice(0, 300);
  if (!clean.length) return;
  await exec(`INSERT IGNORE INTO notice_reads (user_id, notice_id) VALUES ${clean.map(() => '(?, ?)').join(', ')}`,
    clean.flatMap(id => [user.id, id]));
  refresh();
}

export async function saveNotifyPrefs(input: NotifyPrefs): Promise<Result> {
  return handle(async () => {
    const { user } = await requireLogin();
    const clean = {} as NotifyPrefs;
    for (const e of NOTIFY_EVENTS) clean[e.key] = { app: input?.[e.key]?.app !== false, email: input?.[e.key]?.email === true };
    await savePrefs(user.id, { notify: clean });
    refresh();
    return {};
  });
}

export async function saveShareEmail(on: boolean): Promise<Result> {
  return handle(async () => {
    const { user } = await requireLogin();
    await savePrefs(user.id, { shareEmail: Boolean(on) });
    refresh();
    return {};
  });
}

// ---------- office chat ----------

/** Posts to a member's conversation with the office. senderId null = automatic message from the system. */
async function postOfficeMessage(orgId: number, memberId: number, senderId: number | null, fromStaff: boolean, body: string, itemId: number | null = null) {
  await exec('INSERT INTO office_messages (organization_id, member_id, sender_id, from_staff, body, item_id) VALUES (?, ?, ?, ?, ?, ?)',
    [orgId, memberId, senderId, fromStaff ? 1 : 0, body, itemId]);
}

/** Staff wrote: email the member. A member wrote: email the staff who want message emails. */
async function mailChat(orgId: number, memberId: number, senderId: number, fromStaff: boolean, body: string) {
  const excerpt = body.length > 300 ? body.slice(0, 300) + '…' : body;
  if (fromStaff) {
    await emailUser(memberId, 'messages', {
      subject: ['事務所からメッセージが届きました', 'New message from the office'],
      ja: ['事務所からメッセージが届きました：', '', excerpt, '', 'アプリの「メッセージ」から返信できます。'],
      en: ['The office sent you a message:', '', excerpt, '', 'You can reply under Messages in the app:'],
      path: '/messages',
    });
  } else {
    const name = (await one<{ name: string }>('SELECT name FROM users WHERE id = ?', [memberId]))?.name ?? '';
    await emailStaff(orgId, 'messages', {
      subject: ['会員からメッセージが届きました', 'New message from a member'],
      ja: [`${name} さんからメッセージ：`, '', excerpt], en: [`Message from ${name}:`, '', excerpt],
      path: `/messages?with=${memberId}`,
    }, senderId);
  }
}

/** Who may write in a conversation: the member themselves, or staff/admins of that organization (to an approved member). */
async function chatParty(memberId: number | null) {
  const { user } = await requireLogin();
  if (!user.organizationId || user.membershipStatus !== 'approved') throw new ActionError('Join a community first.');
  const staff = user.role === 'staff' || user.role === 'admin';
  if (!staff) return { orgId: user.organizationId, memberId: user.id, uid: user.id, staff };
  if (!memberId) throw new ActionError('Please choose a member.');
  const m = await one(`SELECT id FROM organization_members WHERE user_id = ? AND organization_id = ? AND status = 'approved'`, [memberId, user.organizationId]);
  if (!m) throw new ActionError('Member not found.');
  return { orgId: user.organizationId, memberId, uid: user.id, staff };
}

export async function sendOfficeMessage(memberId: number | null, rawBody: string): Promise<Result> {
  return handle(async () => {
    const p = await chatParty(memberId);
    const body = rawBody.trim();
    if (!body) throw new ActionError('Please write a message.');
    maxLen(body, 2000, 'The message is too long.');
    // A member's reply continues the office's last message: if that was about an item (e.g. a question on a claim),
    // the reply is tagged with the same item so it also shows on the claim card at the front desk.
    let itemId: number | null = null;
    if (!p.staff) {
      const last = await one<{ item_id: number | null; from_staff: number }>(
        'SELECT item_id, from_staff FROM office_messages WHERE organization_id = ? AND member_id = ? ORDER BY id DESC LIMIT 1', [p.orgId, p.memberId]);
      if (last && Number(last.from_staff) === 1) itemId = last.item_id;
    }
    await postOfficeMessage(p.orgId, p.memberId, p.uid, p.staff, body, itemId);
    await mailChat(p.orgId, p.memberId, p.uid, p.staff, body);
    refresh();
    return {};
  });
}

/** The viewer opened the conversation: the other side's messages become read. */
export async function markOfficeRead(memberId: number | null): Promise<void> {
  const p = await chatParty(memberId);
  const r = await exec('UPDATE office_messages SET read_at = NOW() WHERE organization_id = ? AND member_id = ? AND from_staff = ? AND read_at IS NULL',
    [p.orgId, p.memberId, p.staff ? 0 : 1]);
  if (r.affectedRows) refresh();
}

// ---------- questions about a claim ----------

/** Who may talk about a claim: the claimant, or staff/admins of the item's organization. */
async function claimParty(claimId: number) {
  const { user } = await requireLogin();
  const c = await one<{ status: string; claimant_id: number; organization_id: number; found_item_id: number }>(
    'SELECT c.status, c.claimant_id, i.organization_id, c.found_item_id FROM claims c JOIN items i ON i.id = c.found_item_id WHERE c.id = ?', [claimId]);
  if (!c) throw new ActionError('Claim not found.');
  const staff = ['staff', 'admin'].includes(user.role) && user.organizationId === c.organization_id;
  if (!staff && c.claimant_id !== user.id) throw new ActionError('Claim not found.');
  return { uid: user.id, staff, status: c.status, orgId: c.organization_id, memberId: c.claimant_id, itemId: c.found_item_id };
}

export async function sendClaimMessage(claimId: number, rawBody: string): Promise<Result> {
  return handle(async () => {
    const { uid, staff, status, orgId, memberId, itemId } = await claimParty(claimId);
    const body = rawBody.trim();
    if (!body) throw new ActionError('Please write a message.');
    maxLen(body, 1000, 'The message is too long.');
    if (status !== 'pending' && status !== 'approved') throw new ActionError('This claim is closed.');
    // Goes into the claimant's Messages conversation, tagged with the item.
    await postOfficeMessage(orgId, memberId, uid, staff, body, itemId);
    await mailChat(orgId, memberId, uid, staff, body);
    refresh();
    return {};
  });
}

/** The viewer opened the conversation: the other side's messages are read. */
export async function markClaimMessagesRead(claimId: number): Promise<void> {
  const { staff, orgId, memberId, itemId } = await claimParty(claimId);
  // No refresh here: the "New" badge on the claim card stays until the next visit.
  await exec(
    'UPDATE office_messages SET read_at = NOW() WHERE organization_id = ? AND member_id = ? AND item_id = ? AND from_staff = ? AND read_at IS NULL',
    [orgId, memberId, itemId, staff ? 0 : 1]);
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
    await mailMatch(lostId);
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

// ---------- platform (super admin) ----------

/**
 * Adds an organization with its first administrator. The admin is an existing account (by email) that is not in
 * another organization yet, or a new account with a one-time password: shown once here, and emailed to them.
 */
export async function createOrganization(input: { name: string; type: string; description: string; adminName: string; adminEmail: string }):
  Promise<Result<{ orgId: number; newPassword: string | null; adminEmail: string }>> {
  return handle(async () => {
    const { uid } = await requireSuper();
    const name = String(input.name ?? '').trim(), type = String(input.type ?? ''), description = String(input.description ?? '').trim();
    const adminEmail = String(input.adminEmail ?? '').trim().toLowerCase(), adminName = String(input.adminName ?? '').trim();
    if (name.length < 2) throw new ActionError('Please enter the organization name.');
    maxLen(name, 150, 'The name is too long.');
    maxLen(description, 1000, 'The description is too long.');
    if (!ORG_TYPES.includes(type)) throw new ActionError('Please choose a type.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adminEmail) || adminEmail.length > 190) throw new ActionError('Please enter a valid email address.');
    if (await one('SELECT id FROM organizations WHERE LOWER(name) = LOWER(?)', [name])) throw new ActionError('An organization with this name already exists.');

    const existing = await one<{ id: number; name: string; is_super: number; deleted_at: string | null }>(
      'SELECT id, name, is_super, deleted_at FROM users WHERE email = ?', [adminEmail]);
    if (existing && (existing.deleted_at || Number(existing.is_super))) throw new ActionError('This account cannot be an organization admin.');
    if (existing) {
      if (await one(`SELECT id FROM organization_members WHERE user_id = ? AND status = 'approved' LIMIT 1`, [existing.id]))
        throw new ActionError('This person already belongs to another organization. Use another email.');
    } else {
      if (adminName.length < 1) throw new ActionError('Please enter the admin’s name (a new account will be created).');
      maxLen(adminName, 100, 'The name is too long.');
    }

    // Readable one-time password (no 0/O/1/l), only for a new account.
    const newPassword = existing ? null
      : Array.from(randomBytes(10), b => 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789'[b % 55]).join('');
    const orgId = await transaction(async conn => {
      const id = (await exec('INSERT INTO organizations (name, type, description) VALUES (?, ?, ?)', [name, type, description || null], conn)).insertId;
      await exec('INSERT INTO org_settings (organization_id) VALUES (?)', [id], conn);
      const adminId = existing ? existing.id
        : (await exec('INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)', [adminName, adminEmail, await bcrypt.hash(newPassword!, 10)], conn)).insertId;
      // Any open join request elsewhere is replaced by this membership.
      await exec(`UPDATE organization_members SET status = 'left' WHERE user_id = ? AND status = 'pending'`, [adminId], conn);
      await exec(
        `INSERT INTO organization_members (user_id, organization_id, status, role, approved_at, approved_by) VALUES (?, ?, 'approved', 'admin', NOW(), ?)`,
        [adminId, id, uid], conn);
      return id;
    });

    const who = existing?.name ?? adminName;
    await sendMail(adminEmail, `【Lost & Found】${name} の管理者になりました / You are the administrator of ${name}`, [
      `${who} 様`, '',
      `Lost & Found に「${name}」が追加され、あなたが管理者になりました。`,
      ...(newPassword ? [`メール：${adminEmail}`, `初回パスワード：${newPassword}`, 'ログイン後、「アカウント」でパスワードを変更してください。'] : ['いつものアカウントでログインしてください。']),
      `${APP_URL}/login`, '', '―――', '', `Dear ${who},`, '',
      `"${name}" was added to Lost & Found and you are its administrator.`,
      ...(newPassword ? [`Email: ${adminEmail}`, `One-time password: ${newPassword}`, 'After logging in, change your password under Account.'] : ['Log in with your usual account.']),
      `${APP_URL}/login`, '', 'Next: Settings → Places (rooms), categories and shelves; then invite staff and members.',
    ].join('\n'));
    refresh();
    return { orgId, newPassword, adminEmail };
  });
}

/**
 * "Delete my account". The user row is kept but anonymized, because found items at the office, returns and
 * thank-you letters must stay on record (the Lost Property Act). What is only about this person is deleted.
 */
export async function deleteMyAccount(password: string): Promise<Result> {
  return handle(async () => {
    const { user } = await requireLogin();
    if (user.role === 'super') throw new ActionError('The system administrator account cannot be deleted here.');
    const u = await one<{ password_hash: string }>('SELECT password_hash FROM users WHERE id = ?', [user.id]);
    if (!password || !u || !(await bcrypt.compare(password, u.password_hash))) throw new ActionError('The password is wrong.');
    const uid = user.id;

    // Things that would leave someone else stuck: sort them out first.
    if (user.role === 'admin' && user.organizationId) {
      const admins = await one<{ n: number }>(
        `SELECT COUNT(*) AS n FROM organization_members WHERE organization_id = ? AND role = 'admin' AND status = 'approved'`, [user.organizationId]);
      if (Number(admins?.n) <= 1) throw new ActionError('You are the only administrator. Make another member an administrator first.');
    }
    if (await one(`SELECT c.id FROM claims c WHERE c.claimant_id = ? AND c.status = 'approved'`, [uid]))
      throw new ActionError('An item is waiting for you at the office. Pick it up first, or ask the office to cancel the claim.');
    if (await one(
      `SELECT i.id FROM items i JOIN claims c ON c.found_item_id = i.id AND c.status IN ('pending','approved')
       WHERE i.reporter_id = ? AND i.kind = 'found' AND i.received_at IS NULL AND i.handed_in_at IS NULL LIMIT 1`, [uid]))
      throw new ActionError('Someone claimed an item you found. Please hand it to the office first.');

    await transaction(async conn => {
      // Withdraw my open claims; the item goes back on the list if nobody else claimed it.
      const mine = await all<{ found_item_id: number }>(`SELECT found_item_id FROM claims WHERE claimant_id = ? AND status = 'pending'`, [uid], conn);
      await exec(`DELETE FROM claims WHERE claimant_id = ? AND status = 'pending'`, [uid], conn);
      // My lost reports: unlink their matches, then delete them (description and photo are about me).
      const lost = (await all<{ id: number }>(`SELECT id FROM items WHERE reporter_id = ? AND kind = 'lost' AND status < 5`, [uid], conn)).map(r => r.id);
      // Found items I posted that are still with me and unclaimed: nobody needs them on the list any more.
      const kept = (await all<{ id: number }>(
        `SELECT id FROM items WHERE reporter_id = ? AND kind = 'found' AND status < 5 AND received_at IS NULL AND handed_in_at IS NULL`, [uid], conn)).map(r => r.id);
      const gone = [...lost, ...kept];
      if (gone.length) {
        const qs = gone.map(() => '?').join(',');
        const partners = await all<{ id: number }>(`SELECT id FROM items WHERE matched_item_id IN (${qs})`, gone, conn);
        await exec(`UPDATE items SET matched_item_id = NULL, matched_at = NULL WHERE matched_item_id IN (${qs})`, gone, conn);
        await exec(`DELETE FROM items WHERE id IN (${qs})`, gone, conn);
        mine.push(...partners.map(p => ({ found_item_id: p.id })));
      }
      // Items whose claim or match disappeared: back to "registered" / "reported" when nothing else is going on.
      for (const id of new Set(mine.map(m => m.found_item_id))) {
        const active = await one(`SELECT id FROM claims WHERE found_item_id = ? AND status IN ('pending','approved')`, [id], conn);
        if (!active) await exec(`UPDATE items SET status = IF(kind = 'found', 2, 1) WHERE id = ? AND status = 3 AND matched_item_id IS NULL`, [id], conn);
      }
      await exec('DELETE FROM office_messages WHERE member_id = ?', [uid], conn);
      await exec('UPDATE thanks SET show_name = 0 WHERE from_user = ?', [uid], conn);
      await exec('DELETE FROM notice_reads WHERE user_id = ?', [uid], conn);
      await exec('DELETE FROM user_prefs WHERE user_id = ?', [uid], conn);
      await exec('DELETE FROM organization_members WHERE user_id = ?', [uid], conn);
      await exec(
        `UPDATE users SET name = 'Deleted user', email = ?, password_hash = '!', deleted_at = NOW() WHERE id = ?`,
        [`deleted-${uid}-${randomBytes(6).toString('hex')}@deleted.invalid`, uid], conn);
    });
    (await getSession()).destroy();
    refresh();
    return {};
  });
}

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

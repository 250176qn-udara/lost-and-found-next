import 'server-only';
import { cache } from 'react';
import { all, exec, one } from './db';
import { defaultNotifyPrefs, NOTIFY_EVENTS, type NotifyEvent, type NotifyPrefs } from './constants';
import { APP_URL, sendMail } from './mail';

export type UserPrefs = { notify: NotifyPrefs; shareEmail: boolean };

function parseNotify(raw: string | null, staff: boolean): NotifyPrefs {
  const p = defaultNotifyPrefs(staff);
  if (!raw) return p;
  try {
    const v = JSON.parse(raw) as Partial<Record<NotifyEvent, { app?: unknown; email?: unknown }>>;
    for (const e of NOTIFY_EVENTS) {
      const x = v?.[e.key];
      if (x && typeof x === 'object') p[e.key] = { app: x.app !== false, email: x.email === true };
    }
  } catch { /* broken JSON: use the defaults */ }
  return p;
}

const isStaffRole = (role: string | null | undefined) => role === 'staff' || role === 'admin';

/** Cached per request. */
export const getPrefs = cache(async (uid: number): Promise<UserPrefs> => {
  const r = await one<{ notify: string | null; share_email: number | null; role: string | null }>(
    `SELECT p.notify, p.share_email, m.role FROM users u
     LEFT JOIN user_prefs p ON p.user_id = u.id
     LEFT JOIN organization_members m ON m.user_id = u.id AND m.status = 'approved'
     WHERE u.id = ? LIMIT 1`, [uid]);
  return { notify: parseNotify(r?.notify ?? null, isStaffRole(r?.role)), shareEmail: r?.share_email == null ? true : Boolean(Number(r.share_email)) };
});

export async function savePrefs(uid: number, prefs: Partial<{ notify: NotifyPrefs; shareEmail: boolean }>) {
  await exec('INSERT IGNORE INTO user_prefs (user_id) VALUES (?)', [uid]);
  if (prefs.notify) await exec('UPDATE user_prefs SET notify = ? WHERE user_id = ?', [JSON.stringify(prefs.notify), uid]);
  if (prefs.shareEmail !== undefined) await exec('UPDATE user_prefs SET share_email = ? WHERE user_id = ?', [prefs.shareEmail ? 1 : 0, uid]);
}

/** Notice ids this user has read. */
export async function getReadIds(uid: number): Promise<Set<string>> {
  const rows = await all<{ notice_id: string }>('SELECT notice_id FROM notice_reads WHERE user_id = ?', [uid]);
  return new Set(rows.map(r => r.notice_id));
}

// ---------- email ----------

export type Mail = {
  subject: [ja: string, en: string];
  ja: string[];
  en: string[];
  /** Path in the app, e.g. /my-items?tab=claims */
  path: string;
};

function compose(name: string, org: string, m: Mail) {
  const link = APP_URL + m.path;
  return {
    subject: `【Lost & Found】${m.subject[0]} / ${m.subject[1]}`,
    text: [
      `${name} 様`, '', ...m.ja, link, '', '―――', '', `Dear ${name},`, '', ...m.en, link, '',
      `Lost & Found · ${org}`,
      'メール通知はアプリの「通知」で変更できます。 / You can turn these emails off under Notifications in the app.',
    ].join('\n'),
  };
}

/** Emails one user if they want emails for this kind of notification. Never throws. */
export async function emailUser(uid: number, event: NotifyEvent, m: Mail) {
  try {
    const u = await one<{ name: string; email: string; org: string | null }>(
      `SELECT u.name, u.email, o.name AS org FROM users u
       LEFT JOIN organization_members mm ON mm.user_id = u.id AND mm.status = 'approved'
       LEFT JOIN organizations o ON o.id = mm.organization_id WHERE u.id = ? LIMIT 1`, [uid]);
    if (!u || !(await getPrefs(uid)).notify[event].email) return;
    const { subject, text } = compose(u.name, u.org ?? '', m);
    await sendMail(u.email, subject, text);
  } catch (e) {
    console.error('[mail] notification failed', e);
  }
}

/** Emails the staff and admins of an organization who turned on emails for this kind. */
export async function emailStaff(orgId: number, event: NotifyEvent, m: Mail, exceptUid = 0) {
  try {
    const staff = await all<{ user_id: number }>(
      `SELECT user_id FROM organization_members WHERE organization_id = ? AND status = 'approved' AND role IN ('staff','admin') AND user_id <> ?`,
      [orgId, exceptUid]);
    for (const s of staff) await emailUser(Number(s.user_id), event, m);
  } catch (e) {
    console.error('[mail] staff notification failed', e);
  }
}

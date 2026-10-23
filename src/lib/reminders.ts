import 'server-only';
import { all, exec } from './db';
import { FINDER_KEEP_DAYS } from './constants';
import { emailStaff, emailUser } from './prefs';

// Finders may keep a found item for a limited time (Settings → "Finder may keep an item", default 5 days).
// Then it must go to the office, even if nobody has claimed it. This sends the reminders:
//   stage 1: one day before the limit ("please bring it by tomorrow")
//   stage 2: when the limit has passed ("please bring it today"); staff are told too.
// items.keep_reminder remembers the last stage sent, so each reminder goes out once.
// It runs after page loads (at most every 10 minutes, see the app layout) and from /api/cron/reminders.

const EVERY_MS = 10 * 60 * 1000;
let lastRun = 0;
let running: Promise<number> | null = null;

/** Runs the reminders unless they ran less than 10 minutes ago. Never throws. */
export function runFinderRemindersSoon(): Promise<number> {
  if (running) return running;
  if (Date.now() - lastRun < EVERY_MS) return Promise.resolve(0);
  lastRun = Date.now();
  running = runFinderReminders()
    .catch(e => { console.error('[reminders] failed', e); return 0; })
    .finally(() => { running = null; });
  return running;
}

/** Sends every reminder that is due now. Returns how many were sent. */
export async function runFinderReminders(): Promise<number> {
  const rows = await all<{ id: number; organization_id: number; reporter_id: number; title: string; item_code: string | null;
    keep_reminder: number; due: string; overdue: number }>(
    `SELECT i.id, i.organization_id, i.reporter_id, i.title, i.item_code, i.keep_reminder,
            DATE_FORMAT(DATE_ADD(i.created_at, INTERVAL COALESCE(s.finder_keep_days, ?) DAY), '%Y-%m-%d %H:%i') AS due,
            (NOW() >= DATE_ADD(i.created_at, INTERVAL COALESCE(s.finder_keep_days, ?) DAY)) AS overdue
     FROM items i LEFT JOIN org_settings s ON s.organization_id = i.organization_id
     WHERE i.kind = 'found' AND i.status < 5 AND i.received_at IS NULL AND i.handed_in_at IS NULL AND i.keep_reminder < 2
       AND NOW() >= DATE_ADD(i.created_at, INTERVAL COALESCE(s.finder_keep_days, ?) - 1 DAY)`,
    [FINDER_KEEP_DAYS, FINDER_KEEP_DAYS, FINDER_KEEP_DAYS]);
  let sent = 0;
  for (const r of rows) {
    const overdue = Number(r.overdue) === 1;
    const stage = overdue ? 2 : 1;
    if (Number(r.keep_reminder) >= stage) continue;
    // Mark first, so two runs at the same time cannot both send it.
    const claimed = await exec('UPDATE items SET keep_reminder = ? WHERE id = ? AND keep_reminder < ?', [stage, r.id, stage]);
    if (!claimed.affectedRows) continue;
    const code = r.item_code ?? '—';
    const day = r.due.slice(0, 10);
    const ja = overdue
      ? `「${r.title}」（${code}）を預かれる期間（${day}まで）が過ぎました。持ち主が見つかっていなくても、今日中に事務所（受付）へお届けください。届けた後、アプリで「事務所に届ける」を押してください。`
      : `「${r.title}」（${code}）は ${day} までに事務所（受付）へお届けください。持ち主からの請求がなくても届ける必要があります。`;
    const en = overdue
      ? `The time you may keep the "${r.title}" (${code}) has passed (${day}). Please bring it to the office today, even if nobody has claimed it. Then press "Hand over to the office" in the app.`
      : `Please bring the "${r.title}" (${code}) to the office by ${day}, even if nobody has claimed it yet.`;
    await exec('INSERT INTO office_messages (organization_id, member_id, sender_id, from_staff, body, item_id) VALUES (?, ?, NULL, 1, ?, ?)',
      [r.organization_id, r.reporter_id, `${ja}\n\n${en}`, r.id]);
    await emailUser(r.reporter_id, 'messages', {
      subject: overdue ? ['事務所へお届けください（期限を過ぎました）', 'Please bring the item to the office (time limit passed)']
        : ['明日までに事務所へお届けください', 'Please bring the item to the office by tomorrow'],
      ja: [ja], en: [en], path: `/items/${r.id}`,
    });
    if (overdue) {
      await emailStaff(r.organization_id, 'items', {
        subject: ['拾得物が期限内に届けられていません', 'A found item was not handed in on time'],
        ja: [`「${r.title}」（${code}）が期限（${day}）を過ぎても事務所に届けられていません。拾い主に連絡してください。`],
        en: [`"${r.title}" (${code}) was not brought to the office by ${day}. Please contact the finder.`],
        path: `/items/${r.id}`,
      }, r.reporter_id);
    }
    sent++;
  }
  return sent;
}

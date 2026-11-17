import { redirect } from 'next/navigation';
import { getMe, launchPath } from '@/lib/auth';
import { all } from '@/lib/db';
import { DEV_LOGIN, DEV_LOGIN_ORG } from '@/lib/devlogin';
import type { Role } from '@/lib/types';
import { LoginForm, type DevAccount } from './LoginForm';

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ expired?: string }> }) {
  const me = await getMe().catch(() => null);
  if (me) redirect(launchPath(me.user));
  const { expired } = await searchParams;
  // Development shortcut: the demo college's accounts as one-click buttons, shown by position (not name).
  const accounts = DEV_LOGIN ? await devAccounts().catch(() => []) : null;
  return <LoginForm notice={expired ? 'Your session expired. Please log in again.' : ''} devAccounts={accounts} />;
}

/** Accounts for the dev login buttons: only the members of one organization (DEV_LOGIN_ORG, default 1 = the demo college),
 *  by position, with a number when two share it (Member 1, Member 2). Other accounts can still log in by typing their email. */
async function devAccounts(): Promise<DevAccount[]> {
  const rows = await all<{ id: number; email: string; role: Role; org: string }>(
    `SELECT u.id, u.email, m.role, o.name AS org FROM users u
     JOIN organization_members m ON m.user_id = u.id AND m.status = 'approved'
     JOIN organizations o ON o.id = m.organization_id
     WHERE u.deleted_at IS NULL AND m.organization_id = ?
     ORDER BY FIELD(m.role, 'admin', 'staff', 'member'), u.id`, [DEV_LOGIN_ORG]);
  const list = rows.map(r => ({ id: Number(r.id), email: r.email, role: r.role, org: r.org, n: 0 }));
  const key = (a: (typeof list)[number]) => `${a.role}|${a.org}`;
  const total = new Map<string, number>();
  for (const a of list) total.set(key(a), (total.get(key(a)) ?? 0) + 1);
  const seen = new Map<string, number>();
  for (const a of list) if ((total.get(key(a)) ?? 0) > 1) { seen.set(key(a), (seen.get(key(a)) ?? 0) + 1); a.n = seen.get(key(a))!; }
  return list;
}

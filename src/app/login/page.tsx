import { redirect } from 'next/navigation';
import { getMe, launchPath } from '@/lib/auth';
import { all } from '@/lib/db';
import { DEV_LOGIN } from '@/lib/devlogin';
import type { Role } from '@/lib/types';
import { LoginForm, type DevAccount } from './LoginForm';

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ expired?: string }> }) {
  const me = await getMe().catch(() => null);
  if (me) redirect(launchPath(me.user));
  const { expired } = await searchParams;
  // Development shortcut: every account as a one-click button, shown by position (not name) and organization.
  const accounts = DEV_LOGIN ? await devAccounts().catch(() => []) : null;
  return <LoginForm notice={expired ? 'Your session expired. Please log in again.' : ''} devAccounts={accounts} />;
}

/** Accounts for the dev login buttons: position, organization, and a number when two share both (Member 1, Member 2). */
async function devAccounts(): Promise<DevAccount[]> {
  const rows = await all<{ email: string; is_super: number; role: Role | null; org: string | null }>(
    `SELECT u.email, u.is_super, m.role, o.name AS org FROM users u
     LEFT JOIN organization_members m ON m.user_id = u.id AND m.status = 'approved'
     LEFT JOIN organizations o ON o.id = m.organization_id
     WHERE u.deleted_at IS NULL
     ORDER BY u.is_super DESC, o.name, FIELD(m.role, 'admin', 'staff', 'member'), u.id`);
  const list = rows.map(r => ({ email: r.email, role: Number(r.is_super) ? 'super' as const : r.role, org: r.org, n: 0 }));
  const key = (a: (typeof list)[number]) => `${a.role}|${a.org}`;
  const total = new Map<string, number>();
  for (const a of list) total.set(key(a), (total.get(key(a)) ?? 0) + 1);
  const seen = new Map<string, number>();
  for (const a of list) if ((total.get(key(a)) ?? 0) > 1) { seen.set(key(a), (seen.get(key(a)) ?? 0) + 1); a.n = seen.get(key(a))!; }
  return list;
}

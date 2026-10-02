import { redirect } from 'next/navigation';
import { getMe, startPath } from '@/lib/auth';
import { all } from '@/lib/db';
import { DEV_LOGIN } from '@/lib/devlogin';
import { LoginForm } from './LoginForm';

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ expired?: string }> }) {
  const me = await getMe().catch(() => null);
  if (me) redirect(startPath(me.user));
  const { expired } = await searchParams;
  // Development shortcut: list every account so you can log in with one click.
  const accounts = DEV_LOGIN
    ? await all<{ name: string; email: string }>('SELECT name, email FROM users ORDER BY id').catch(() => [])
    : null;
  return <LoginForm notice={expired ? 'Your session expired. Please log in again.' : ''} devAccounts={accounts} />;
}

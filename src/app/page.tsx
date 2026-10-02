import { redirect } from 'next/navigation';
import { getMe, startPath } from '@/lib/auth';

export default async function Index() {
  const me = await getMe();
  redirect(me ? startPath(me.user) : '/login');
}

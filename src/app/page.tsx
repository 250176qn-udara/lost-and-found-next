import { redirect } from 'next/navigation';
import { getMe, launchPath } from '@/lib/auth';

export default async function Index() {
  const me = await getMe();
  redirect(me ? launchPath(me.user) : '/login');
}

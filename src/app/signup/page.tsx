import { redirect } from 'next/navigation';
import { getMe, startPath } from '@/lib/auth';
import { DEV_LOGIN } from '@/lib/devlogin';
import { SignupForm } from './SignupForm';

export default async function SignupPage() {
  const me = await getMe().catch(() => null);
  if (me) redirect(startPath(me.user));
  return <SignupForm dev={DEV_LOGIN} />;
}

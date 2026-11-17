import { redirect } from 'next/navigation';
import { getMe, launchPath } from '@/lib/auth';
import { ForgotForm } from './ForgotForm';

/** "Forgot your password?": ask for a one-time link by email. */
export default async function ForgotPasswordPage() {
  const me = await getMe().catch(() => null);
  if (me) redirect(launchPath(me.user));
  return <ForgotForm />;
}

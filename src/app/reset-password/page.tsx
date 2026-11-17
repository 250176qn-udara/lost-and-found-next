import { ResetForm } from './ResetForm';

/** Opened from the "Forgot password" email: choose a new password. The token is checked when the form is sent. */
export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token = '' } = await searchParams;
  return <ResetForm token={token} />;
}

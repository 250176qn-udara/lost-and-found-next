'use client';

import Link from 'next/link';
import { useState, useTransition, type FormEvent } from 'react';
import { resetPassword } from '@/app/actions';
import { useT } from '@/components/Providers';
import { ErrorText, Field } from '@/components/ui';

export function ResetForm({ token }: { token: string }) {
  const t = useT();
  const [err, setErr] = useState(token ? '' : 'This link is invalid or has expired. Please ask for a new one.');
  const [done, setDone] = useState(false);
  const [busy, start] = useTransition();

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const password = String(fd.get('password') ?? '');
    if (password.length < 6) return setErr('Password must be at least 6 characters.');
    if (password !== String(fd.get('confirm') ?? '')) return setErr('The two passwords do not match.');
    setErr('');
    start(async () => {
      const r = await resetPassword(token, password);
      if (!r.ok) return setErr(r.error);
      setDone(true);
    });
  }

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={submit}>
        <h1>{t('Set a new password')}</h1>
        {done ? (
          <>
            <div className="box note teal" role="status">
              <b>{t('Your password was changed')}</b>
              <div className="meta">{t('You can now log in with your new password.')}</div>
            </div>
            <Link className="btn" href="/login">{t('Go to login')}</Link>
          </>
        ) : (
          <>
            <p className="sub">{t('Choose a new password for your account (at least 6 characters).')}</p>
            <Field label={t('New password')}><input name="password" type="password" autoComplete="new-password" autoFocus disabled={!token} /></Field>
            <Field label={t('Confirm new password')}><input name="confirm" type="password" autoComplete="new-password" disabled={!token} /></Field>
            <ErrorText msg={t(err)} />
            <button className="btn" disabled={busy || !token}>{t('Save new password')}</button>
            <p style={{ textAlign: 'center', marginTop: 20 }}><Link href="/forgot-password">{t('Ask for a new link')}</Link></p>
          </>
        )}
      </form>
    </div>
  );
}

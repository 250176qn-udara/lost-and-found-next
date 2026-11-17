'use client';

import Link from 'next/link';
import { useState, useTransition, type FormEvent } from 'react';
import { requestPasswordReset } from '@/app/actions';
import { useT } from '@/components/Providers';
import { ErrorText, Field } from '@/components/ui';

export function ForgotForm() {
  const t = useT();
  const [err, setErr] = useState('');
  const [sent, setSent] = useState<{ email: string; devLink?: string } | null>(null);
  const [busy, start] = useTransition();

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const email = String(new FormData(e.currentTarget).get('email') ?? '').trim();
    if (!email) return setErr('Please enter your email.');
    setErr('');
    start(async () => {
      const r = await requestPasswordReset(email);
      if (!r.ok) return setErr(r.error);
      setSent({ email, devLink: r.devLink });
    });
  }

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={submit}>
        <h1>{t('Forgot your password?')}</h1>
        {sent ? (
          <>
            <div className="box note teal" role="status">
              <b>{t('Check your email')}</b>
              <div className="meta">{t('If an account uses {email}, we sent it a link to set a new password. The link works once and expires in 1 hour.', { email: sent.email })}</div>
            </div>
            {sent.devLink && (
              <div className="box note amber">
                <b>{t('Development mode')}</b>
                <div className="meta">{t('No mail server is set up, so here is the link from the email:')}</div>
                <a href={sent.devLink} style={{ wordBreak: 'break-all' }}>{t('Set a new password')} →</a>
              </div>
            )}
            <p className="meta">{t("Didn't get it? Check your spam folder, or try again in a few minutes.")}</p>
          </>
        ) : (
          <>
            <p className="sub">{t('Enter the email you signed up with. We will send you a link to set a new password.')}</p>
            <Field label={t('Email')}><input name="email" type="email" placeholder={t('Enter your email')} autoComplete="email" autoFocus /></Field>
            <ErrorText msg={t(err)} />
            <button className="btn" disabled={busy}>{t(busy ? 'Sending…' : 'Send reset link')}</button>
          </>
        )}
        <p style={{ textAlign: 'center', marginTop: 20 }}><Link href="/login">← {t('Back to login')}</Link></p>
      </form>
    </div>
  );
}

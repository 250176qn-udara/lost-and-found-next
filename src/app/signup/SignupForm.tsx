'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition, type FormEvent } from 'react';
import { register } from '@/app/actions';
import { useT, useToast } from '@/components/Providers';
import { ErrorText, Field } from '@/components/ui';

/** dev: development login mode — no password fields (the server gives the account a default password). */
export function SignupForm({ dev }: { dev: boolean }) {
  const t = useT();
  const toast = useToast();
  const router = useRouter();
  const [err, setErr] = useState('');
  const [busy, start] = useTransition();

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const name = String(fd.get('name') ?? '').trim();
    const email = String(fd.get('email') ?? '').trim().toLowerCase();
    const password = String(fd.get('password') ?? '');
    const confirm = String(fd.get('confirm') ?? '');
    setErr('');
    if (!name || !email || (!dev && (!password || !confirm))) return setErr('Please fill in all fields.');
    if (!/^\S+@\S+\.\S+$/.test(email)) return setErr('Please enter a valid email address.');
    if (!dev && password.length < 6) return setErr('Password must be at least 6 characters.');
    if (!dev && password !== confirm) return setErr('Passwords do not match.');
    start(async () => {
      const r = await register(name, email, password);
      if (!r.ok) return setErr(r.error);
      toast('Account created');
      router.push(r.to);
    });
  }

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={submit}>
        <h1>{t('Create Account')}</h1>
        <p className="sub">{t('Create your Lost & Found account.')}</p>
        <Field label={t('Name')}><input name="name" placeholder={t('Your name')} autoComplete="name" /></Field>
        <Field label={t('Email')}><input name="email" type="email" placeholder="you@example.com" autoComplete="email" /></Field>
        {!dev && (
          <>
            <Field label={t('Password')}><input name="password" type="password" placeholder={t('At least 6 characters')} autoComplete="new-password" /></Field>
            <Field label={t('Confirm Password')}><input name="confirm" type="password" placeholder={t('Enter password again')} autoComplete="new-password" /></Field>
          </>
        )}
        {dev && <p className="meta">{t('Development mode: no password needed. The account gets the password 123456.')}</p>}
        <ErrorText msg={t(err)} />
        <button className="btn" disabled={busy}>{t('Create Account')}</button>
        <p style={{ textAlign: 'center', marginTop: 20 }}>
          {t('Already have an account?')} <Link className="btn sec" href="/login">{t('Login')}</Link>
        </p>
      </form>
    </div>
  );
}

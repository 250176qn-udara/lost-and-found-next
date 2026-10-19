'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition, type FormEvent } from 'react';
import { login } from '@/app/actions';
import { useT } from '@/components/Providers';
import { ErrorText, Field } from '@/components/ui';

type Account = { name: string; email: string };

/** devAccounts is set only in development login mode: then a name is enough and there is no password field. */
export function LoginForm({ notice, devAccounts }: { notice: string; devAccounts: Account[] | null }) {
  const t = useT();
  const router = useRouter();
  const [err, setErr] = useState(notice);
  const [busy, start] = useTransition();
  const dev = devAccounts !== null;

  function signIn(id: string, password: string) {
    setErr('');
    start(async () => {
      const r = await login(id, password);
      if (!r.ok) return setErr(r.error);
      router.push(r.to);
    });
  }

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const id = String(fd.get('email') ?? '').trim();
    const password = String(fd.get('password') ?? '');
    if (!id || (!dev && !password)) return setErr('Please fill in all fields.');
    signIn(id, password);
  }

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={submit}>
        <h1>{t('Welcome to Lost & Found')}</h1>
        <p className="sub">{t('Login to manage your lost and found items.')}</p>
        {dev && (
          <div className="box note amber">
            <b>{t('Development mode')}</b>
            <div className="meta">{t('No password needed. Type a name or email, or pick an account below.')}</div>
          </div>
        )}
        {dev ? (
          <Field label={t('Name or email')}><input name="email" placeholder={t('e.g. Aiko Tanaka')} autoComplete="username" autoFocus /></Field>
        ) : (
          <>
            <Field label={t('Email')}><input name="email" type="email" placeholder={t('Enter your email')} autoComplete="email" /></Field>
            <Field label={t('Password')}><input name="password" type="password" placeholder={t('Enter your password')} autoComplete="current-password" /></Field>
          </>
        )}
        <ErrorText msg={t(err)} />
        <button className="btn" disabled={busy}>{t('Login')}</button>
        {dev && devAccounts.length > 0 && (
          <>
            <p className="meta" style={{ margin: '18px 0 8px' }}>{t('Log in as')}</p>
            <div className="chips" style={{ margin: 0 }}>
              {devAccounts.map(a => (
                <button key={a.email} type="button" disabled={busy} title={a.email} onClick={() => signIn(a.email, '')}>{a.name}</button>
              ))}
            </div>
          </>
        )}
        <p style={{ textAlign: 'center', marginTop: 20 }}>
          {t("Don't have an account?")} <Link className="btn sec" href="/signup">{t('Create Account')}</Link>
        </p>
        <p style={{ textAlign: 'center', margin: '12px 0 0' }}>
          <a href="/how-it-works.html">{t('How does it work? See the 2-minute guide')} →</a>
        </p>
      </form>
    </div>
  );
}

'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition, type FormEvent } from 'react';
import { login } from '@/app/actions';
import { useT } from '@/components/Providers';
import { Icon } from '@/components/Icon';
import { POSITION, POSITION_ICON } from '@/lib/constants';
import type { Role } from '@/lib/types';
import { ErrorText, Field } from '@/components/ui';

/** A demo account button: shown by position and organization, never by name. n > 0 numbers accounts that share both. */
export type DevAccount = { email: string; role: Role | null; org: string | null; n: number };

/** devAccounts is set only in development login mode: then a name is enough and there is no password field. */
export function LoginForm({ notice, devAccounts }: { notice: string; devAccounts: DevAccount[] | null }) {
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
          <Field label={t('Name or email')}><input name="email" placeholder={t('e.g. you@example.com')} autoComplete="username" autoFocus /></Field>
        ) : (
          <>
            <Field label={t('Email')}><input name="email" type="email" placeholder={t('Enter your email')} autoComplete="email" /></Field>
            <Field label={t('Password')}><input name="password" type="password" placeholder={t('Enter your password')} autoComplete="current-password" /></Field>
          </>
        )}
        <ErrorText msg={t(err)} />
        <button className="btn" disabled={busy}>{t('Login')}</button>
        <p style={{ margin: '10px 0 0', textAlign: 'right' }}><Link href="/forgot-password">{t('Forgot your password?')}</Link></p>
        {dev && devAccounts.length > 0 && (
          <>
            {/* All buttons are one organization's accounts, so its name is shown once here. */}
            <p className="meta" style={{ margin: '18px 0 8px' }}>{t('Log in as')}{devAccounts[0].org && <> · <b>{t(devAccounts[0].org)}</b></>}</p>
            <div className="devaccts">
              {devAccounts.map(a => {
                const position = a.role ? t(POSITION[a.role]) + (a.n ? ` ${a.n}` : '') : t('No organization yet');
                return (
                  <button key={a.email} type="button" className={'devacct pos-' + (a.role ?? 'none')} disabled={busy}
                    title={position} onClick={() => signIn(a.email, '')}>
                    <span className="avatar" aria-hidden="true"><Icon name={a.role ? POSITION_ICON[a.role] : 'user'} size={16} /></span>
                    <span className="devacct-txt"><b>{position}</b></span>
                  </button>
                );
              })}
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

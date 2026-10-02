'use client';

import { useState, useTransition, type FormEvent } from 'react';
import { changePassword } from '@/app/actions';
import { useT, useToast } from '@/components/Providers';
import { ErrorText, Field } from '@/components/ui';

export function PasswordForm() {
  const t = useT();
  const toast = useToast();
  const [err, setErr] = useState('');
  const [busy, start] = useTransition();

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const current = String(fd.get('current') ?? ''), next = String(fd.get('next') ?? ''), again = String(fd.get('again') ?? '');
    setErr('');
    if (next !== again) return setErr('Passwords do not match.');
    start(async () => {
      const r = await changePassword(current, next);
      if (!r.ok) return setErr(r.error);
      form.reset();
      toast('Password changed');
    });
  }

  return (
    <form className="box" onSubmit={submit}>
      <h2 style={{ marginTop: 0 }}>{t('Change password')}</h2>
      <Field label={t('Current password')}><input name="current" type="password" autoComplete="current-password" /></Field>
      <Field label={t('New password')}><input name="next" type="password" autoComplete="new-password" placeholder={t('At least 6 characters')} /></Field>
      <Field label={t('Confirm Password')}><input name="again" type="password" autoComplete="new-password" /></Field>
      <ErrorText msg={t(err)} />
      <button className="btn" disabled={busy}>{t('Save password')}</button>
    </form>
  );
}

// MOCK: privacy choices are not saved yet.
const SWITCHES: [label: string, sub: string, on: boolean][] = [
  ['Hide my name from finders', 'Only staff can see who you are', true],
  ['Show my email to staff', 'Helps staff contact you about a claim', true],
  ['Email notifications', 'Get important updates by email', false],
];

export function PrivacySwitches() {
  const t = useT();
  const toast = useToast();
  return (
    <div className="box" style={{ marginBottom: 16 }}>
      <h2 style={{ marginTop: 0 }}>{t('Privacy')}</h2>
      {SWITCHES.map(([label, sub, on]) => (
        <label className="sw" key={label}>
          <span>{t(label)}<div className="meta">{t(sub)}</div></span>
          <input type="checkbox" defaultChecked={on} onChange={() => toast('Setting saved')} />
        </label>
      ))}
    </div>
  );
}

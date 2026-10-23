'use client';

import { useState, useTransition } from 'react';
import { createOrganization } from '@/app/actions';
import { ORG_TYPES } from '@/lib/constants';
import { useT, useToast } from '@/components/Providers';
import { ErrorText, Field } from '@/components/ui';

const EMPTY = { name: '', type: 'School', description: '', adminName: '', adminEmail: '' };

/** Super admin: add an organization and its first administrator. */
export function AddOrganizationButton() {
  const t = useT();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [f, setF] = useState(EMPTY);
  const [err, setErr] = useState('');
  const [done, setDone] = useState<{ email: string; password: string | null; name: string } | null>(null);
  const [busy, start] = useTransition();
  const set = (k: keyof typeof EMPTY) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });

  const save = () => start(async () => {
    setErr('');
    const r = await createOrganization(f);
    if (!r.ok) return setErr(r.error);
    toast('Organization created');
    setDone({ email: r.adminEmail, password: r.newPassword, name: f.name });
    setF(EMPTY);
  });
  const close = () => { setOpen(false); setDone(null); setErr(''); setF(EMPTY); };

  if (!open) return <button className="btn" onClick={() => setOpen(true)}>{t('Add organization')}</button>;
  return (
    <div className="box" style={{ width: '100%', maxWidth: 640, marginLeft: 'auto' }}>
      {done ? (
        <>
          <h2 style={{ marginTop: 0 }}>{t('{name} was added', { name: done.name })}</h2>
          {done.password ? (
            <div className="hidden-note">
              <b>{t('New admin account — this password is shown only once')}</b>
              <div className="kvline"><span className="meta">{t('Email')}</span> <code>{done.email}</code></div>
              <div className="kvline"><span className="meta">{t('One-time password')}</span> <code className="otp">{done.password}</code></div>
              <div className="meta" style={{ marginTop: 6 }}>{t('It was also emailed to them. They should change it after logging in.')}</div>
            </div>
          ) : <p className="meta">{t('{email} is now its administrator and was told by email.', { email: done.email })}</p>}
          <div className="btnrow"><button className="btn sec" onClick={close}>{t('Done')}</button></div>
        </>
      ) : (
        <>
          <h2 style={{ marginTop: 0 }}>{t('Add organization')}</h2>
          <div className="two">
            <Field label={t('Name')}><input value={f.name} maxLength={150} onChange={set('name')} placeholder={t('e.g. Yokohama Design College')} autoFocus /></Field>
            <Field label={t('Type')}><select value={f.type} onChange={set('type')}>{ORG_TYPES.map(x => <option key={x} value={x}>{t(x)}</option>)}</select></Field>
          </div>
          <Field label={t('Description (optional)')}><input value={f.description} maxLength={1000} onChange={set('description')} placeholder={t('e.g. address or campus')} /></Field>
          <h3 style={{ margin: '6px 0' }}>{t('First administrator')}</h3>
          <p className="meta" style={{ marginTop: 0 }}>{t('Use the email of an existing account, or enter a name and email to create a new account.')}</p>
          <div className="two">
            <Field label={t('Email')}><input type="email" value={f.adminEmail} maxLength={190} onChange={set('adminEmail')} /></Field>
            <Field label={t('Name (new account only)')}><input value={f.adminName} maxLength={100} onChange={set('adminName')} /></Field>
          </div>
          <ErrorText msg={t(err)} />
          <div className="btnrow" style={{ marginTop: 0 }}>
            <button className="btn" disabled={busy || !f.name.trim() || !f.adminEmail.trim()} onClick={save}>{t('Create organization')}</button>
            <button className="btn sec" onClick={close}>{t('Cancel')}</button>
          </div>
        </>
      )}
    </div>
  );
}

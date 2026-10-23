'use client';

import { useState, useTransition, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { changePassword, deleteMyAccount, saveShareEmail, saveShowInRanking } from '@/app/actions';
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

/** Saved per user. Finders never see who claimed their item; that is a fixed rule, not a choice. */
export function PrivacySwitches({ shareEmail, showInRanking, isMember }: { shareEmail: boolean; showInRanking: boolean; isMember: boolean }) {
  const t = useT();
  const toast = useToast();
  const [share, setShare] = useState(shareEmail);
  const [rank, setRank] = useState(showInRanking);
  const [busy, start] = useTransition();
  const flip = () => {
    const next = !share;
    setShare(next);
    start(async () => {
      const r = await saveShareEmail(next);
      if (!r.ok) { setShare(!next); toast(r.error); } else toast('Setting saved');
    });
  };
  const flipRank = () => {
    const next = !rank;
    setRank(next);
    start(async () => {
      const r = await saveShowInRanking(next);
      if (!r.ok) { setRank(!next); toast(r.error); } else toast('Setting saved');
    });
  };
  return (
    <div className="box" style={{ marginBottom: 16 }}>
      <h2 style={{ marginTop: 0 }}>{t('Privacy')}</h2>
      {isMember && (
        <label className="sw">
          <span>{t('Show me in "Top helpers"')}<div className="meta">{t('Your name and points appear in the ranking of your community.')}</div></span>
          <input type="checkbox" checked={rank} disabled={busy} onChange={flipRank} />
        </label>
      )}
      {isMember && (
        <label className="sw">
          <span>{t('Show my email to staff')}<div className="meta">{t('Shown on your claims so staff can contact you. Without it, staff use Messages.')}</div></span>
          <input type="checkbox" checked={share} disabled={busy} onChange={flip} />
        </label>
      )}
      <div className="sw">
        <span>{t('Email notifications')}<div className="meta">{t('Choose which updates you get by email.')}</div></span>
        <Link className="btn sec" href="/notifications">{t('Notification settings')}</Link>
      </div>
      <p className="meta">{t('Finders never see who claimed their item, and other members never see what you reported as lost.')}</p>
    </div>
  );
}

/** "Delete my account": explains what happens, asks for the password, then logs out. */
export function DeleteAccount() {
  const t = useT();
  const toast = useToast();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pw, setPw] = useState('');
  const [sure, setSure] = useState(false);
  const [err, setErr] = useState('');
  const [busy, start] = useTransition();
  const del = () => start(async () => {
    setErr('');
    const r = await deleteMyAccount(pw);
    if (!r.ok) return setErr(r.error);
    toast('Your account was deleted');
    router.replace('/login');
    router.refresh();
  });
  if (!open) return <button className="btn bad" onClick={() => setOpen(true)}>{t('Delete my account')}</button>;
  return (
    <div className="hidden-note" style={{ marginTop: 12, borderColor: 'var(--red)' }}>
      <b>{t('Delete my account')}</b>
      <ul className="meta" style={{ margin: '6px 0 10px', paddingLeft: 18 }}>
        <li>{t('Your name and email are removed and you cannot log in again.')}</li>
        <li>{t('Your lost reports, open claims and messages are deleted.')}</li>
        <li>{t('Items already at the office, returns and thank-you letters stay on record without your name, as the law requires.')}</li>
      </ul>
      <Field label={t('Password')}><input type="password" value={pw} autoComplete="current-password" onChange={e => setPw(e.target.value)} /></Field>
      <label className="sw" style={{ borderTop: 0 }}>
        <span>{t('I understand that this cannot be undone.')}</span>
        <input type="checkbox" checked={sure} onChange={e => setSure(e.target.checked)} />
      </label>
      <ErrorText msg={t(err)} />
      <div className="btnrow" style={{ marginTop: 0 }}>
        <button className="btn bad" disabled={busy || !sure || !pw} onClick={del}>{t('Delete my account')}</button>
        <button className="btn sec" onClick={() => { setOpen(false); setPw(''); setSure(false); setErr(''); }}>{t('Cancel')}</button>
      </div>
    </div>
  );
}

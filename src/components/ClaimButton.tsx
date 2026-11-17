'use client';

import { useState, useTransition } from 'react';
import { requestClaim } from '@/app/actions';
import { Modal } from './Modal';
import { useT, useToast } from './Providers';
import { ErrorText, Field } from './ui';

/**
 * Button that opens the claim form for a found item. Kept short on purpose: one thing only the owner would know
 * (that is what proves ownership), and one optional line for where and when it was lost.
 */
export function ClaimButton({ itemId, label, className = 'btn' }: { itemId: number; label: string; className?: string }) {
  const t = useT();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [details, setDetails] = useState('');
  const [where, setWhere] = useState('');
  const [err, setErr] = useState('');
  const [busy, start] = useTransition();
  const close = () => { setOpen(false); setErr(''); };

  function send() {
    setErr('');
    if (!details.trim()) return setErr('Please answer the verification questions.');
    start(async () => {
      const r = await requestClaim(itemId, { details, place: where, date: '' });
      if (!r.ok) return setErr(r.error);
      close();
      setDetails(''); setWhere('');
      toast('Claim sent to staff');
    });
  }

  return (
    <>
      <button className={className} onClick={() => setOpen(true)}>{t(label)}</button>
      {open && (
        <Modal onClose={close}>
          <h1>{t('Claim item')}</h1>
          <p className="sub">{t('One thing only you would know is enough. Staff check it and you pick the item up with your ID.')}</p>
          <Field label={t('What is something only you would know about it?')}>
            <textarea rows={3} placeholder={t('e.g. what is inside, a name tag, a scratch')} value={details} onChange={e => setDetails(e.target.value)} autoFocus />
          </Field>
          <Field label={t('Where and when did you lose it?') + ' (' + t('Optional') + ')'}>
            <input value={where} maxLength={190} placeholder={t('e.g. Library 2F, last Tuesday')} onChange={e => setWhere(e.target.value)} />
          </Field>
          <ErrorText msg={t(err)} />
          <button className="btn" disabled={busy} onClick={send}>{t('Send claim')}</button>{' '}
          <button className="btn sec" onClick={close}>{t('Cancel')}</button>
        </Modal>
      )}
    </>
  );
}

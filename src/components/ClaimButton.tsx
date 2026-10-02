'use client';

import { useState, useTransition } from 'react';
import { requestClaim } from '@/app/actions';
import { Modal } from './Modal';
import { useT, useToast } from './Providers';
import { ErrorText, Field } from './ui';

/** Button that opens the claim form for a found item. */
export function ClaimButton({ itemId, label, className = 'btn' }: { itemId: number; label: string; className?: string }) {
  const t = useT();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [answers, setAnswers] = useState('');
  const [err, setErr] = useState('');
  const [busy, start] = useTransition();
  const close = () => { setOpen(false); setErr(''); };

  function send() {
    setErr('');
    if (!answers.trim()) return setErr('Please answer the verification questions.');
    start(async () => {
      const r = await requestClaim(itemId, answers);
      if (!r.ok) return setErr(r.error);
      close();
      setAnswers('');
      toast('Claim sent to staff');
    });
  }

  return (
    <>
      <button className={className} onClick={() => setOpen(true)}>{t(label)}</button>
      {open && (
        <Modal onClose={close}>
          <h1>{t('Claim item')}</h1>
          <p className="sub">{t('Answer these, then show ID at the office to collect it.')}</p>
          <Field label={t('What color is it? Any marks or stickers?')}>
            <textarea rows={3} placeholder={t('Describe details only the owner would know')} value={answers} onChange={e => setAnswers(e.target.value)} autoFocus />
          </Field>
          <ErrorText msg={t(err)} />
          <button className="btn" disabled={busy} onClick={send}>{t('Send claim')}</button>{' '}
          <button className="btn sec" onClick={close}>{t('Cancel')}</button>
        </Modal>
      )}
    </>
  );
}

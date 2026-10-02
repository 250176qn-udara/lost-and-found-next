'use client';

import { useState, useTransition } from 'react';
import { closeItem } from '@/app/actions';
import { DISPOSAL_METHODS } from '@/lib/constants';
import { Modal } from './Modal';
import { useT, useToast } from './Providers';
import { ErrorText, Field } from './ui';

/** Staff close a found item that leaves the office without its owner (e.g. handed to police). */
export function CloseItemButton({ itemId, label = 'Close item', preset }: { itemId: number; label?: string; preset?: string }) {
  const t = useT();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [method, setMethod] = useState(preset ?? DISPOSAL_METHODS[0]);
  const [note, setNote] = useState('');
  const [err, setErr] = useState('');
  const [busy, start] = useTransition();
  const close = () => { setOpen(false); setErr(''); };

  return (
    <>
      <button className="btn bad" onClick={() => setOpen(true)}>{t(label)}</button>
      {open && (
        <Modal onClose={close}>
          <h1>{t('Close item')}</h1>
          <p className="sub">{t('The item leaves the office without its owner. This is kept in the records.')}</p>
          <Field label={t('What happened to it')}>
            <select value={method} onChange={e => setMethod(e.target.value)}>{DISPOSAL_METHODS.map(m => <option key={m} value={m}>{t(m)}</option>)}</select>
          </Field>
          <Field label={t('Note')}><input value={note} onChange={e => setNote(e.target.value)} placeholder={t('e.g. Police receipt number')} /></Field>
          <ErrorText msg={t(err)} />
          <button className="btn" disabled={busy} onClick={() => start(async () => {
            const r = await closeItem(itemId, method, note);
            if (!r.ok) return setErr(r.error);
            close();
            toast('Item closed');
          })}>{t('Close item')}</button>{' '}
          <button className="btn sec" onClick={close}>{t('Cancel')}</button>
        </Modal>
      )}
    </>
  );
}

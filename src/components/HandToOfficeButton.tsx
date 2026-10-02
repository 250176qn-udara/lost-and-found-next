'use client';

import { useState, useTransition } from 'react';
import { handToOffice } from '@/app/actions';
import { Modal } from './Modal';
import { useT, useToast } from './Providers';
import { ErrorText } from './ui';

/** The finder confirms they gave their found item to the office front desk. */
export function HandToOfficeButton({ itemId, itemCode }: { itemId: number; itemCode: string | null }) {
  const t = useT();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [err, setErr] = useState('');
  const [busy, start] = useTransition();
  const close = () => { setOpen(false); setErr(''); };

  return (
    <>
      <button className="btn" onClick={() => setOpen(true)}>{t('Hand over to the office')}</button>
      {open && (
        <Modal onClose={close}>
          <h1>{t('Hand over to the office')}</h1>
          <p className="sub">{t('Take the item to the office front desk and tell staff this item code.')}</p>
          {itemCode && <div className="pass" style={{ margin: '0 auto 16px', padding: 14 }}><div className="code">{itemCode}</div></div>}
          <p className="meta">{t('Press the button below after you gave the item to staff. Staff will confirm it.')}</p>
          <ErrorText msg={t(err)} />
          <button className="btn" disabled={busy} onClick={() => start(async () => {
            const r = await handToOffice(itemId);
            if (!r.ok) return setErr(r.error);
            close();
            toast('Thank you. Staff will confirm the item');
          })}>{t('I handed it to the office')}</button>{' '}
          <button className="btn sec" onClick={close}>{t('Cancel')}</button>
        </Modal>
      )}
    </>
  );
}

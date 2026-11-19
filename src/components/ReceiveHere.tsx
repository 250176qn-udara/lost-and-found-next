'use client';

import Link from 'next/link';
import { useState, useTransition } from 'react';
import { receiveAtOffice } from '@/app/actions';
import { Icon } from './Icon';
import { useT, useToast } from './Providers';
import { ErrorText, Field } from './ui';

/** Item page (staff): the finder brought the item. Choose the shelf and confirm; the details were already posted. */
export function ReceiveHere({ itemId, shelves, handedIn }: { itemId: number; shelves: string[]; handedIn: boolean }) {
  const t = useT();
  const toast = useToast();
  const [shelf, setShelf] = useState(shelves[0] ?? '');
  const [err, setErr] = useState('');
  const [busy, start] = useTransition();
  return (
    <div className="receivehere">
      <p className="meta" style={{ marginTop: 0 }}>
        {t(handedIn ? 'The finder says they brought it. When you have the item, choose its shelf and confirm.' : 'When the finder brings the item, choose its shelf and confirm.')}
      </p>
      <div className="receivehere-row">
        <Field label={t('Storage shelf')}>
          <select value={shelf} onChange={e => setShelf(e.target.value)}>{shelves.map(s => <option key={s}>{s}</option>)}</select>
        </Field>
        <button className="btn" disabled={busy || !shelf} onClick={() => start(async () => {
          setErr('');
          const r = await receiveAtOffice(itemId, shelf);
          if (!r.ok) return setErr(r.error);
          toast(t('Received. Item code {code}', { code: r.itemCode }));
        })}><Icon name="inbox" size={16} />{t(busy ? 'Saving…' : 'Confirm it is at the office')}</button>
      </div>
      <ErrorText msg={t(err)} />
      <Link className="meta" href={`/register?receive=${itemId}`}>{t('Need to correct the details too? Open the full form')} →</Link>
    </div>
  );
}

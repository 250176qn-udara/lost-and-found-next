'use client';

import { useState, useTransition } from 'react';
import { linkMatch, rejectMatch } from '@/app/actions';
import { Modal } from './Modal';
import { useT, useToast } from './Providers';
import { ErrorText, Field } from './ui';

/** Removes a suggested match ("Not mine" for the owner, "Not a match" for staff). */
export function RejectMatchButton({ lostId, label }: { lostId: number; label: string }) {
  const t = useT();
  const toast = useToast();
  const [busy, start] = useTransition();
  return (
    <button className="btn sec" disabled={busy} onClick={() => start(async () => {
      const r = await rejectMatch(lostId);
      toast(r.ok ? 'Match removed. Thanks for telling us' : r.error);
    })}>{t(label)}</button>
  );
}

type Option = { id: number; title: string; place: string; item_code: string | null; owner: string };

/** Staff pick an open lost report and a found item at the office and link them. */
export function LinkManuallyButton({ lost, found }: { lost: Option[]; found: Option[] }) {
  const t = useT();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [lostId, setLostId] = useState(lost[0]?.id ?? 0);
  const [foundId, setFoundId] = useState(found[0]?.id ?? 0);
  const [err, setErr] = useState('');
  const [busy, start] = useTransition();
  const close = () => { setOpen(false); setErr(''); };

  return (
    <>
      <button className="btn sec" onClick={() => setOpen(true)}>{t('Link manually')}</button>
      {open && (
        <Modal onClose={close}>
          <h1>{t('Link manually')}</h1>
          <p className="sub">{t('Choose the lost report and the found item that belong together.')}</p>
          {lost.length && found.length ? (
            <>
              <Field label={t('Lost report')}>
                <select value={lostId} onChange={e => setLostId(Number(e.target.value))}>
                  {lost.map(o => <option key={o.id} value={o.id}>{o.title} · {o.owner} · {t(o.place)}</option>)}
                </select>
              </Field>
              <Field label={t('Found item')}>
                <select value={foundId} onChange={e => setFoundId(Number(e.target.value))}>
                  {found.map(o => <option key={o.id} value={o.id}>{o.title} · {o.item_code ?? '—'} · {t(o.place)}</option>)}
                </select>
              </Field>
              <ErrorText msg={t(err)} />
              <button className="btn" disabled={busy} onClick={() => start(async () => {
                const r = await linkMatch(lostId, foundId);
                if (!r.ok) return setErr(r.error);
                close();
                toast('Items linked');
              })}>{t('Link items')}</button>{' '}
            </>
          ) : <p className="meta">{t('There are no open lost reports or found items to link.')}</p>}
          <button className="btn sec" onClick={close}>{t('Cancel')}</button>
        </Modal>
      )}
    </>
  );
}

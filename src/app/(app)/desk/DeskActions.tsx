'use client';

import { useState, useTransition } from 'react';
import { decideClaim, handoverClaim } from '@/app/actions';
import { ID_TYPES } from '@/lib/constants';
import { useT, useToast } from '@/components/Providers';
import { ErrorText, Field } from '@/components/ui';

export function DecideButtons({ id }: { id: number }) {
  const t = useT();
  const toast = useToast();
  const [busy, start] = useTransition();
  const decide = (action: 'approve' | 'reject') => start(async () => {
    const r = await decideClaim(id, action);
    toast(!r.ok ? r.error : action === 'approve' ? 'Claim approved. The owner got a pickup code' : 'Claim rejected');
  });
  return (
    <div className="btnrow">
      <button className="btn" disabled={busy} onClick={() => decide('approve')}>{t('Approve — it matches')}</button>
      <button className="btn bad" disabled={busy} onClick={() => decide('reject')}>{t('Reject')}</button>
    </div>
  );
}

const CHECKS = ['Photo ID matches the owner', 'Answers match the item'];

/** Handover at the desk: pickup code + ID check. */
export function HandoverForm({ id, hasCode, ready }: { id: number; hasCode: boolean; ready: boolean }) {
  const t = useT();
  const toast = useToast();
  const [code, setCode] = useState('');
  const [done, setDone] = useState(CHECKS.map(() => false));
  const [idType, setIdType] = useState(ID_TYPES[0]);
  const [err, setErr] = useState('');
  const [busy, start] = useTransition();
  const ok = ready && done.every(Boolean) && (!hasCode || code.replace(/\D/g, '').length === 6);

  return (
    <div>
      {hasCode && (
        <Field label={t('Pickup code from the owner')}>
          <input className="codeinput" inputMode="numeric" maxLength={7} value={code} placeholder="000000" onChange={e => setCode(e.target.value)} style={{ maxWidth: 220 }} />
        </Field>
      )}
      {CHECKS.map((c, i) => (
        <label className="chk" key={c}>
          <input type="checkbox" checked={done[i]} onChange={e => setDone(done.map((d, j) => (j === i ? e.target.checked : d)))} />
          <span>{t(c)}</span>
        </label>
      ))}
      <div className="two" style={{ marginTop: 12 }}>
        <Field label={t('ID shown')}>
          <select value={idType} onChange={e => setIdType(e.target.value)}>{ID_TYPES.map(x => <option key={x} value={x}>{t(x)}</option>)}</select>
        </Field>
      </div>
      <ErrorText msg={t(err)} />
      <button className="btn" disabled={!ok || busy} onClick={() => start(async () => {
        setErr('');
        const r = await handoverClaim(id, idType, code);
        if (!r.ok) return setErr(r.error);
        toast('Handover recorded');
      })}>{t('Complete handover')}</button>
    </div>
  );
}

'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition, type FormEvent } from 'react';
import { deskLookup } from '@/app/actions';
import { Icon } from './Icon';
import { useT } from './Providers';
import { QrScanner } from './QrScanner';
import { ErrorText } from './ui';

/**
 * Front desk: "someone is at the counter". Type or scan what they show: the item code (finder's screen or the QR label)
 * or the owner's 6-digit pickup code. Opens that item's page at the step to do now.
 */
export function DeskLookup() {
  const t = useT();
  const router = useRouter();
  const [text, setText] = useState('');
  const [scan, setScan] = useState(false);
  const [err, setErr] = useState('');
  const [busy, start] = useTransition();

  const go = (value: string) => {
    setErr('');
    start(async () => {
      const r = await deskLookup(value);
      if (!r.ok) return setErr(r.error);
      router.push(`/items/${r.itemId}${r.pickupCode ? `?code=${r.pickupCode}` : ''}#case`);
    });
  };
  const submit = (e: FormEvent) => { e.preventDefault(); go(text); };

  return (
    <form className="box desklookup" onSubmit={submit}>
      <div className="desklookup-head">
        <span className="icon-chip"><Icon name="scan" /></span>
        <div>
          <b>{t('Someone at the desk?')}</b>
          <div className="meta">{t('Type or scan the item code (finder) or the 6-digit pickup code (owner). The item opens at the step to do now.')}</div>
        </div>
      </div>
      <div className="desklookup-row">
        <input value={text} onChange={e => setText(e.target.value)} placeholder={t('LF-2026-0148 or 123456')} aria-label={t('Item code or pickup code')}
          autoComplete="off" inputMode="text" />
        <button className="btn" disabled={busy}><Icon name="search" size={16} />{t(busy ? 'Looking…' : 'Open')}</button>
        <button type="button" className="btn sec" onClick={() => setScan(s => !s)}><Icon name="camera" size={16} />{t(scan ? 'Stop scanning' : 'Scan QR')}</button>
      </div>
      {scan && <div style={{ marginTop: 12 }}><QrScanner autoStart onCode={code => { setScan(false); setText(code); go(code); }} /></div>}
      <ErrorText msg={t(err)} />
    </form>
  );
}

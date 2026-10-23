'use client';

import { useCallback, useEffect, useRef, useState, useTransition, type FormEvent } from 'react';
import { scanItem } from '@/app/actions';
import { statusName } from '@/lib/constants';
import type { ScannedItem } from '@/lib/types';
import { useT, useToast } from '@/components/Providers';
import Link from 'next/link';
import { placeDate, Stepper } from '@/components/ui';
import { itemCodeFrom, QrScanner } from '@/components/QrScanner';

type Scan = [time: string, code: string, title: string];
// Kept for the browser tab's lifetime so the list survives moving between pages (like SCANS in app.js).
let recentScans: Scan[] = [];

export function ScanPanel({ initialCode = '' }: { initialCode?: string }) {
  const t = useT();
  const toast = useToast();
  const [code, setCode] = useState('');
  const [item, setItem] = useState<ScannedItem | null>(null);
  const [error, setError] = useState('');
  const [scans, setScans] = useState<Scan[]>(recentScans);
  const [busy, start] = useTransition();

  const find = useCallback((raw: string) => {
    const v = itemCodeFrom(raw);
    if (!v) return toast('Enter an item ID first');
    setCode(v);
    start(async () => {
      const r = await scanItem(v);
      if (!r.ok) {
        setItem(null);
        setError(r.error);
        return;
      }
      setItem(r.item);
      setError('');
      const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      recentScans = [[time, v, r.item.title] as Scan, ...recentScans].slice(0, 5);
      setScans(recentScans);
    });
  }, [toast]);
  function lookUp(e: FormEvent) {
    e.preventDefault();
    find(code);
  }
  // /register?tab=lookup&code=LF-… looks the item up right away.
  const first = useRef(initialCode);
  useEffect(() => { if (first.current) find(first.current); first.current = ''; }, [find]);

  return (
    <>
      <form className="box" style={{ maxWidth: 640, marginBottom: 16 }} onSubmit={lookUp}>
        <QrScanner onCode={find} />
        <div className="field">
          <label htmlFor="scanId">{t('Item ID')}</label>
          <input id="scanId" value={code} placeholder="LF-2026-0148" onChange={e => setCode(e.target.value)} autoFocus />
        </div>
        <button className="btn" disabled={busy}>{t('Look up item')}</button>
      </form>

      {item ? <ScanCard it={item} /> : error ? (
        <div className="box" style={{ borderColor: 'var(--red)', background: 'var(--redbg)' }}>
          <b>{t('No item found')}</b><div className="meta">{t(error)}</div>
        </div>
      ) : (
        <div className="box">
          <b>{t('Ready to scan')}</b>
          <div className="meta">{t('Scan the QR label or the owner’s pickup pass with the camera, use a USB scanner, or type the item ID.')}</div>
        </div>
      )}

      <h2>{t('Recent scans')}</h2>
      {scans.length ? (
        <table>
          <thead><tr><th>{t('Time')}</th><th>ID</th><th>{t('Item')}</th></tr></thead>
          <tbody>{scans.map((s, i) => <tr key={i}><td>{s[0]}</td><td>{s[1]}</td><td>{s[2]}</td></tr>)}</tbody>
        </table>
      ) : <div className="box meta">{t('No scans yet today.')}</div>}
    </>
  );
}

function ScanCard({ it }: { it: ScannedItem }) {
  const t = useT();
  const n = it.status;
  return (
    <div className={'tag' + (n === 5 ? ' done' : '')}>
      <div className="row">
        <div><b>{it.title}</b><div className="meta">{t('{code} · Shelf {shelf}', { code: it.itemCode, shelf: it.shelf || '—' })}</div></div>
        <span className={'badge ' + (n === 5 ? 'ok' : '')}>{t(statusName(n))}</span>
      </div>
      <div className="cmp">
        <div>{t('Found at: {place}', { place: placeDate(it.place, it.date, t) })}</div>
        <div>{t('Reported by: {name}', { name: it.reporterName })}</div>
      </div>
      <Stepper n={Math.min(n, 5)} t={t} />
      <p style={{ margin: '14px 0 0', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <Link className="btn sec" href={`/items/${it.id}`}>{t('Open the item')}</Link>
        <Link className="btn sec" href={`/label/${it.id}?then=/register?tab=lookup`}>{t('Print label')}</Link>
      </p>
      {it.pickupReady && (
        <div className="hidden-note" style={{ marginTop: 14 }}>
          <b>{t('The owner is approved and can pick this up.')}</b>
          <div className="meta">{t('Check their photo ID and pickup code at the handover.')}</div>
          <p style={{ margin: '8px 0 0' }}><Link className="btn" href="/desk?tab=pickups">{t('Go to handover')}</Link></p>
        </div>
      )}
      {n < 3 && <p style={{ margin: '14px 0 0' }} className="meta">{t('No claims yet.')}</p>}
    </div>
  );
}

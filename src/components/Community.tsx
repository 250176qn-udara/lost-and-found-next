'use client';

import { useState, useTransition } from 'react';
import { clapThanks, reportSighting, saveAlertAreas } from '@/app/actions';
import { useT, useToast } from './Providers';

/** Choose the buildings to watch for "Have you seen this?" alerts. */
export function AlertAreas({ buildings, initial }: { buildings: string[]; initial: string[] }) {
  const t = useT();
  const toast = useToast();
  const [on, setOn] = useState(initial);
  const [busy, start] = useTransition();
  const flip = (b: string) => {
    const next = on.includes(b) ? on.filter(x => x !== b) : [...on, b];
    setOn(next);
    start(async () => {
      const r = await saveAlertAreas(next);
      if (!r.ok) { setOn(on); toast(r.error); } else toast(next.includes(b) ? 'You will get alerts for this place' : 'Alerts turned off for this place');
    });
  };
  return (
    <div className="watchbox">
      <div>
        <b>{t('Get alerts when something is lost in:')}</b>
        <div className="meta">{t('You will see a notification. Email is off unless you turn it on under Notifications.')}</div>
      </div>
      <div className="chips" style={{ margin: 0 }}>
        {buildings.map(b => (
          <button key={b} type="button" className={on.includes(b) ? 'on' : ''} disabled={busy} aria-pressed={on.includes(b)} onClick={() => flip(b)}>
            {on.includes(b) ? '🔔 ' : ''}{b === 'Other' ? t('Other places') : t('Bldg {b}', { b })}
          </button>
        ))}
      </div>
    </div>
  );
}

/** "I saw it": a short note to the owner (who never learns who sent it). */
export function SightingButton({ itemId, done }: { itemId: number; done: boolean }) {
  const t = useT();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState('');
  const [sent, setSent] = useState(done);
  const [err, setErr] = useState('');
  const [busy, start] = useTransition();
  if (sent) return <span className="badge ok">{t('You told the owner. Thank you!')}</span>;
  if (!open) return <button type="button" className="btn sec" onClick={() => setOpen(true)}>👀 {t('I saw it')}</button>;
  const send = () => start(async () => {
    setErr('');
    const r = await reportSighting(itemId, note);
    if (!r.ok) return setErr(r.error);
    setSent(true);
    toast('Sent to the owner. Thank you!');
  });
  return (
    <div className="sightform">
      <textarea rows={2} maxLength={300} value={note} onChange={e => setNote(e.target.value)} autoFocus
        placeholder={t('Where and when? e.g. On a desk in B号館 Lab 2F around 3pm')} aria-label={t('Where and when did you see it?')} />
      {err && <div className="meta" style={{ color: 'var(--red)' }}>{t(err)}</div>}
      <div className="btnrow" style={{ marginTop: 6 }}>
        <button type="button" className="btn" disabled={busy || !note.trim()} onClick={send}>{t('Tell the owner')}</button>
        <button type="button" className="btn sec" onClick={() => setOpen(false)}>{t('Cancel')}</button>
      </div>
      <p className="meta" style={{ margin: '4px 0 0' }}>{t('The owner does not see your name.')}</p>
    </div>
  );
}

/** 👏 on a thank-you wall story. */
export function ClapButton({ id, count, clapped }: { id: number; count: number; clapped: boolean }) {
  const t = useT();
  const [state, setState] = useState({ n: count, on: clapped });
  const [pop, setPop] = useState(0);
  const [busy, start] = useTransition();
  const click = () => {
    const was = state;
    setState({ n: state.n + (state.on ? -1 : 1), on: !state.on });
    if (!state.on) setPop(p => p + 1);
    start(async () => { const r = await clapThanks(id); if (!r.ok) setState(was); });
  };
  return (
    <button type="button" className={'clap' + (state.on ? ' on' : '')} disabled={busy} onClick={click} aria-pressed={state.on} aria-label={t('Clap')}>
      <span key={pop} className={pop ? 'clap-pop' : ''}>👏</span> <b>{state.n}</b>
    </button>
  );
}

'use client';

import { useState, useTransition } from 'react';
import { aiMatchOpenReports } from '@/app/actions';
import { Icon } from './Icon';
import { useT } from './Providers';

type Run = { checked: number; left: number; found: { lost: string; found: string; score: number }[] };

/** Item list → Matches: run Gemini over open lost reports that have no match yet. */
export function AiMatchPanel({ ready, open }: { ready: boolean; open: number }) {
  const t = useT();
  const [run, setRun] = useState<Run | null>(null);
  const [err, setErr] = useState('');
  const [busy, start] = useTransition();
  const go = () => start(async () => {
    setErr('');
    const r = await aiMatchOpenReports();
    if (!r.ok) return setErr(r.error);
    setRun({ checked: r.checked, left: r.left, found: r.found });
  });

  return (
    <div className={'aipanel' + (busy ? ' busy' : '')}>
      <div className="aipanel-head">
        <Icon name="spark" size={20} />
        <div style={{ flex: 1, minWidth: 200 }}>
          <b>{t('AI matching')}</b> <span className={'badge ' + (ready ? 'ok' : '')}>{t(ready ? 'On' : 'Off')}</span>
          <div className="meta">{t(!ready
            ? 'Add a Gemini API key to compare reports by meaning and photos. Until then, matches use category, place and date.'
            : busy ? 'Gemini is comparing the open lost reports with the found items…'
            : 'New reports are checked by AI automatically. You can also check the open lost reports that have no match yet.')}</div>
        </div>
        {ready && (
          <button className="btn" disabled={busy || open === 0} onClick={go}>
            {t(busy ? 'Checking…' : open === 0 ? 'No open reports' : 'Check open reports with AI ({n})', { n: Math.min(open, 10) })}
          </button>
        )}
      </div>
      {err && <p className="meta" style={{ color: 'var(--red)', margin: '8px 0 0' }}>{t(err)}</p>}
      {run && (
        <div className="aipanel-result">
          <b>{t(run.found.length ? 'AI found {n} new matches in {m} reports.' : 'AI checked {m} reports. No new matches.', { n: run.found.length, m: run.checked })}</b>
          {run.found.map((f, i) => (
            <div key={i} className="meta">✨ {f.lost} ↔ {f.found}{f.score ? ` · ${f.score}%` : ''}</div>
          ))}
          {run.left > 0 && <div className="meta">{t('More reports are waiting. Press the button again to check the next ones.')}</div>}
        </div>
      )}
    </div>
  );
}

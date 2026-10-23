// Small building blocks shared by Server and Client Components (no hooks here).
import type { CSSProperties, ReactNode } from 'react';
import Link from 'next/link';
import { STEPS } from '@/lib/constants';
import type { T } from '@/lib/i18n';

export const Head = ({ title, sub }: { title: string; sub: string }) => (
  <>
    <h1>{title}</h1>
    <p className="sub">{sub}</p>
  </>
);

export const Stat = ({ n, label }: { n: ReactNode; label: string }) => (
  <div className="box stat"><b>{n}</b><span>{label}</span></div>
);

export const Field = ({ label, children }: { label: string; children: ReactNode }) => (
  <div className="field"><label>{label}</label>{children}</div>
);

/** Progress through Reported → Returned; the first n steps are highlighted. */
export const Stepper = ({ n, t }: { n: number; t: T }) => (
  <div className="steps">
    {STEPS.map((s, i) => <span key={s} className={i < n ? 'on' : ''}>{t(s)}</span>)}
  </div>
);

export const Note = ({ children, style }: { children: ReactNode; style?: CSSProperties }) => (
  <div className="box" style={{ background: 'var(--amberbg)', borderColor: 'var(--amber)', marginBottom: 16, ...style }}>{children}</div>
);

export const ErrorText = ({ msg }: { msg: string }) => (
  <div style={{ color: 'var(--red)', marginBottom: 12 }}>{msg}</div>
);

/** "Library · 2026-09-24" */
export const placeDate = (place: string, date: string | null, t: T) => t(place) + (date ? ' · ' + date : '');

// ---------- building blocks for the extra screens ----------

export const Callout = ({ kind = 'amber', children }: { kind?: 'amber' | 'teal' | 'red'; children: ReactNode }) => (
  <div className={'box note ' + kind}>{children}</div>
);

/** Progress bar; kind 'warn' is amber, 'bad' is red. */
export const Prog = ({ pct, kind = '' }: { pct: number; kind?: '' | 'warn' | 'bad' }) => (
  <div className={'prog ' + kind}><i style={{ width: Math.max(0, Math.min(100, pct)) + '%' }} /></div>
);

export type TimelineEvent = { label: string; meta: string; on: boolean };
export const Timeline = ({ events }: { events: TimelineEvent[] }) => (
  <ul className="tl">
    {events.map((e, i) => <li key={i} className={e.on ? 'on' : ''}><b>{e.label}</b><span className="meta">{e.meta}</span></li>)}
  </ul>
);

/** Simple bar chart; bar height is scaled to the largest value. */
export const Bars = ({ data }: { data: [label: string, n: number][] }) => {
  const max = Math.max(1, ...data.map(d => d[1]));
  return (
    <div className="box" style={{ paddingBottom: 36 }}>
      <div className="bars">
        {data.map(([l, n], i) => (
          <div key={l} title={`${l}: ${n}`} style={{ height: Math.max(6, (n / max) * 140), animationDelay: `${i * 0.07}s` }}>
            <em style={{ animationDelay: `${0.5 + i * 0.07}s` }}>{n}</em><span>{l}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

/** Donut chart with a legend; parts are [label, count, colour]. Shows each part's share in %. */
export const Donut = ({ parts }: { parts: [label: string, n: number, color: string][] }) => {
  const total = parts.reduce((a, p) => a + p[1], 0) || 1;
  let at = 0;
  const stops = parts.map(([, n, c]) => { const s = at; at += (n / total) * 100; return `${c} ${s}% ${at}%`; });
  return (
    <div className="donutbox">
      <div className="donut" style={{ background: parts.length ? `conic-gradient(${stops.join(',')})` : 'var(--line)' }} />
      <div style={{ flex: 1, minWidth: 150 }}>
        {parts.map(([l, n, c]) => <div className="lg" key={l}><i style={{ background: c }} /><span>{l}</span><b>{Math.round((n / total) * 100)}%</b></div>)}
      </div>
    </div>
  );
};

export const Kv = ({ label, value }: { label: string; value: ReactNode }) =>
  value === null || value === undefined || value === '' ? null : (
    <div className="kv"><span className="meta">{label}</span><b>{value}</b></div>
  );

/** Builds "/path?a=1&b=2", leaving out empty values. */
export function href(path: string, params: Record<string, string | number | undefined | null>) {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== null && v !== '') q.set(k, String(v));
  const s = q.toString();
  return s ? `${path}?${s}` : path;
}

/** Filter chips as links. `make` returns the link for one option. */
export const LinkChips = ({ options, current, make, t }: { options: string[]; current: string; make: (o: string) => string; t: T }) => (
  <div className="chips">
    {options.map(o => <Link key={o} href={make(o)} className={current === o ? 'on' : ''}>{t(o)}</Link>)}
  </div>
);

export const KindBadge = ({ kind, t }: { kind: 'lost' | 'found' | null; t: T }) =>
  <span className={'badge ' + (kind === 'lost' ? 'no' : 'ok')}>{t(kind === 'lost' ? 'Lost' : 'Found')}</span>;

/** Short date + time from a MySQL "YYYY-MM-DD HH:MM:SS" string. */
export const when = (s: string | null) => (s ? s.slice(0, 16) : '—');

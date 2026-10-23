'use client';

import { useEffect, useRef, useState } from 'react';

const reduced = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
const ease = (x: number) => 1 - Math.pow(1 - x, 3);

/** A number that counts up from 0 when it appears. `template` like "{n} days" or "{n}%". */
export function CountUp({ value, template = '{n}', ms = 900, delay = 0 }: { value: number; template?: string; ms?: number; delay?: number }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (reduced() || value === 0) { setN(value); return; }
    let raf = 0;
    const start = performance.now() + delay;
    const step = (now: number) => {
      const p = Math.min(1, Math.max(0, (now - start) / ms));
      setN(Math.round(value * ease(p)));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value, ms, delay]);
  return <>{template.replace('{n}', n.toLocaleString())}</>;
}

/**
 * Donut chart drawn with SVG: each part draws in after the previous one. Hovering a part or its legend row
 * highlights it and shows its count in the middle; otherwise the middle shows the total.
 */
export function DonutChart({ parts, totalLabel }: { parts: [label: string, n: number, color: string][]; totalLabel: string }) {
  const [hover, setHover] = useState<number | null>(null);
  const [drawn, setDrawn] = useState(false);
  const ref = useRef<SVGSVGElement>(null);
  useEffect(() => {
    if (reduced()) { setDrawn(true); return; }
    const id = requestAnimationFrame(() => setDrawn(true));
    return () => cancelAnimationFrame(id);
  }, []);
  const total = parts.reduce((a, p) => a + p[1], 0);
  const R = 52, C = 2 * Math.PI * R;
  let at = 0;
  const segs = parts.map(([label, n, color], i) => {
    const len = total ? (n / total) * C : 0;
    const seg = { label, n, color, len, offset: at, i };
    at += len;
    return seg;
  });
  const h = hover !== null ? parts[hover] : null;

  return (
    <div className="donutbox">
      <div className="donut2">
        <svg ref={ref} viewBox="0 0 140 140" width="160" height="160" role="img" aria-label={totalLabel}>
          <circle cx="70" cy="70" r={R} fill="none" stroke="var(--line2)" strokeWidth="18" />
          {segs.map(s => (
            <circle key={s.i} cx="70" cy="70" r={R} fill="none" stroke={s.color} strokeWidth={hover === s.i ? 22 : 18}
              strokeDasharray={`${drawn ? Math.max(0, s.len - 1.5) : 0} ${C}`} strokeDashoffset={-s.offset}
              transform="rotate(-90 70 70)" className="donut-seg"
              style={{ transitionDelay: `${s.i * 90}ms`, opacity: hover === null || hover === s.i ? 1 : 0.35 }}
              onMouseEnter={() => setHover(s.i)} onMouseLeave={() => setHover(null)} />
          ))}
        </svg>
        <div className="donut-mid">
          {h ? <><b>{h[1].toLocaleString()}</b><span>{Math.round((h[1] / (total || 1)) * 100)}% · {h[0]}</span></>
            : <><b><CountUp value={total} /></b><span>{totalLabel}</span></>}
        </div>
      </div>
      <div style={{ flex: 1, minWidth: 150 }}>
        {parts.map(([l, n, c], i) => (
          <div className={'lg' + (hover === i ? ' on' : '')} key={l} style={{ animationDelay: `${0.15 + i * 0.06}s` }}
            onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
            <i style={{ background: c }} /><span>{l}</span><b>{Math.round((n / (total || 1)) * 100)}%</b>
          </div>
        ))}
      </div>
    </div>
  );
}

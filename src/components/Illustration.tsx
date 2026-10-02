// Small flat illustrations for empty states and the "how it works" steps.
import type { ReactNode } from 'react';

const B = '#2563eb', L = '#dbeafe', A = '#f59e0b', G = '#22c55e', S = '#94a3b8', W = '#ffffff';

const ART: Record<string, ReactNode> = {
  // an open box
  empty: (
    <>
      <ellipse cx="60" cy="96" rx="40" ry="6" fill="#e2e8f0" />
      <path d="M22 44 60 30l38 14v36L60 94 22 80z" fill={L} />
      <path d="M22 44 60 58l38-14M60 58v36" stroke={B} strokeWidth="3" fill="none" strokeLinejoin="round" />
      <path d="M22 44 60 30l38 14-38 14z" fill="#bfdbfe" stroke={B} strokeWidth="3" strokeLinejoin="round" />
      <path d="M22 44 10 34l38-14 12 10M98 44l12-10-38-14-12 10" fill={W} stroke={B} strokeWidth="3" strokeLinejoin="round" />
    </>
  ),
  // magnifier over a tag
  search: (
    <>
      <ellipse cx="60" cy="98" rx="38" ry="5" fill="#e2e8f0" />
      <rect x="18" y="34" width="56" height="40" rx="8" fill={L} stroke={B} strokeWidth="3" />
      <circle cx="31" cy="54" r="4" fill={B} />
      <path d="M41 50h22M41 59h14" stroke={B} strokeWidth="3" strokeLinecap="round" />
      <circle cx="78" cy="56" r="17" fill={W} fillOpacity=".7" stroke={A} strokeWidth="4" />
      <path d="m90 69 14 14" stroke={A} strokeWidth="6" strokeLinecap="round" />
    </>
  ),
  // phone with a bell
  report: (
    <>
      <ellipse cx="60" cy="98" rx="34" ry="5" fill="#e2e8f0" />
      <rect x="38" y="16" width="44" height="76" rx="9" fill={W} stroke={B} strokeWidth="3" />
      <rect x="45" y="28" width="30" height="20" rx="4" fill={L} />
      <path d="M46 58h28M46 66h20M46 74h24" stroke={S} strokeWidth="3" strokeLinecap="round" />
      <circle cx="84" cy="24" r="12" fill={A} />
      <path d="M84 18v7M84 29h.01" stroke={W} strokeWidth="3" strokeLinecap="round" />
    </>
  ),
  // two hands / item check at the office
  verify: (
    <>
      <ellipse cx="60" cy="98" rx="40" ry="5" fill="#e2e8f0" />
      <rect x="16" y="30" width="58" height="40" rx="6" fill={W} stroke={B} strokeWidth="3" />
      <circle cx="33" cy="47" r="7" fill={L} stroke={B} strokeWidth="2.5" />
      <path d="M24 62c2-5 5.5-7 9-7s7 2 9 7M50 44h16M50 52h11" stroke={B} strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="84" cy="66" r="18" fill={G} />
      <path d="m76 66 6 6 11-12" stroke={W} strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  // returned: box with a heart
  done: (
    <>
      <ellipse cx="60" cy="98" rx="40" ry="5" fill="#e2e8f0" />
      <path d="M26 46h68v44H26z" fill={L} stroke={B} strokeWidth="3" strokeLinejoin="round" />
      <path d="M22 36h76v12H22z" fill="#bfdbfe" stroke={B} strokeWidth="3" strokeLinejoin="round" />
      <path d="M60 36v54" stroke={B} strokeWidth="3" />
      <path d="M60 30c-4-9-17-7-15 1 2 5 15 5 15 5s13 0 15-5c2-8-11-10-15-1z" fill={A} />
    </>
  ),
};

export function Illustration({ name, size = 120 }: { name: keyof typeof ART | string; size?: number }) {
  return (
    <svg className="illus" viewBox="0 0 120 108" width={size} height={(size * 108) / 120} aria-hidden="true">
      {ART[name] ?? ART.empty}
    </svg>
  );
}

/** Friendly empty state: picture, title, text and an optional action. */
export function Empty({ art = 'empty', title, text, children }: { art?: string; title: string; text?: string; children?: ReactNode }) {
  return (
    <div className="empty">
      <Illustration name={art} />
      <b>{title}</b>
      {text && <p className="meta">{text}</p>}
      {children}
    </div>
  );
}

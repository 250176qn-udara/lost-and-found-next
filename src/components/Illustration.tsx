// Small flat illustrations for empty states and the "how it works" steps.
import type { ReactNode } from 'react';

// Pastel clay palette: soft brown outline, mint, peach, coral, sage, warm white (matches the app theme).
const B = '#9A6B55', L = '#C9DED2', A = '#F6A18C', G = '#A9C7B5', S = '#C4AE9C', W = '#FFF9F1';
const P = '#FFD8C7', Y = '#F8D99B', SKIN = '#FFE2D0', SHADOW = '#EED9C4';

const ART: Record<string, ReactNode> = {
  // an open box
  empty: (
    <>
      <ellipse cx="60" cy="96" rx="40" ry="6" fill={SHADOW} />
      <path d="M22 44 60 30l38 14v36L60 94 22 80z" fill={L} />
      <path d="M22 44 60 58l38-14M60 58v36" stroke={B} strokeWidth="3" fill="none" strokeLinejoin="round" />
      <path d="M22 44 60 30l38 14-38 14z" fill={P} stroke={B} strokeWidth="3" strokeLinejoin="round" />
      <path d="M22 44 10 34l38-14 12 10M98 44l12-10-38-14-12 10" fill={W} stroke={B} strokeWidth="3" strokeLinejoin="round" />
    </>
  ),
  // magnifier over a tag
  search: (
    <>
      <ellipse cx="60" cy="98" rx="38" ry="5" fill={SHADOW} />
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
      <ellipse cx="60" cy="98" rx="34" ry="5" fill={SHADOW} />
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
      <ellipse cx="60" cy="98" rx="40" ry="5" fill={SHADOW} />
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
      <ellipse cx="60" cy="98" rx="40" ry="5" fill={SHADOW} />
      <path d="M26 46h68v44H26z" fill={L} stroke={B} strokeWidth="3" strokeLinejoin="round" />
      <path d="M22 36h76v12H22z" fill={P} stroke={B} strokeWidth="3" strokeLinejoin="round" />
      <path d="M60 36v54" stroke={B} strokeWidth="3" />
      <path d="M60 30c-4-9-17-7-15 1 2 5 15 5 15 5s13 0 15-5c2-8-11-10-15-1z" fill={A} />
    </>
  ),
  // the app's mascot: a smiling lost-and-found box with a magnifier
  mascot: (
    <>
      <ellipse cx="58" cy="100" rx="34" ry="5" fill={SHADOW} />
      <g className="bob">
        <rect x="24" y="36" width="68" height="58" rx="18" fill={P} stroke={B} strokeWidth="3" />
        <rect x="20" y="26" width="76" height="20" rx="10" fill="#FFE9DE" stroke={B} strokeWidth="3" />
        <path d="M30 32h22" stroke={W} strokeWidth="3" strokeLinecap="round" opacity=".8" />
        <circle cx="46" cy="64" r="4.5" fill={B} /><circle cx="70" cy="64" r="4.5" fill={B} />
        <circle cx="47.6" cy="62.4" r="1.4" fill={W} /><circle cx="71.6" cy="62.4" r="1.4" fill={W} />
        <ellipse cx="38" cy="74" rx="5" ry="3" fill={A} opacity=".7" /><ellipse cx="78" cy="74" rx="5" ry="3" fill={A} opacity=".7" />
        <path d="M51 75q7 6 14 0" stroke={B} strokeWidth="3" fill="none" strokeLinecap="round" />
      </g>
      <circle cx="96" cy="30" r="12" fill={W} fillOpacity=".85" stroke={B} strokeWidth="3" />
      <path d="m104 39 8 8" stroke={B} strokeWidth="5" strokeLinecap="round" />
      <path className="twinkle" d="M12 18v8M8 22h8" stroke={Y} strokeWidth="3" strokeLinecap="round" />
    </>
  ),
  // a student giving back a found item (a box with a heart)
  finder: (
    <>
      <ellipse cx="60" cy="101" rx="40" ry="5" fill={SHADOW} />
      <g className="bob">
        <path d="M36 99c0-19 11-31 24-31s24 12 24 31z" fill={L} stroke={B} strokeWidth="3" strokeLinejoin="round" />
        <circle cx="60" cy="46" r="17" fill={SKIN} stroke={B} strokeWidth="3" />
        <path d="M43 45c0-12 8-19 17-19s17 7 17 19c-4-6-10-9-17-9s-13 3-17 9z" fill="#8C6650" />
        <circle cx="54" cy="49" r="2.3" fill={B} /><circle cx="66" cy="49" r="2.3" fill={B} />
        <ellipse cx="49" cy="55" rx="3.5" ry="2" fill={A} opacity=".7" /><ellipse cx="71" cy="55" rx="3.5" ry="2" fill={A} opacity=".7" />
        <path d="M55 56q5 4 10 0" stroke={B} strokeWidth="2.5" fill="none" strokeLinecap="round" />
        <rect x="42" y="70" width="36" height="24" rx="7" fill={Y} stroke={B} strokeWidth="3" />
        <path d="M60 87c-3-5-10-3-8.5 1.5 1 3 8.5 6 8.5 6s7.5-3 8.5-6C70 84 63 82 60 87z" fill={A} />
        <path d="M46 75h12" stroke={W} strokeWidth="2.5" strokeLinecap="round" opacity=".8" />
      </g>
      <path className="pop" d="M98 24c-3-6-12-4-10 2 1 4 10 8 10 8s9-4 10-8c2-6-7-8-10-2z" fill={A} />
      <path className="twinkle" d="M16 30v8M12 34h8" stroke={Y} strokeWidth="3" strokeLinecap="round" />
      <circle className="twinkle t2" cx="104" cy="60" r="3" fill={G} />
    </>
  ),
  // the office: shelves with boxes, a tag with a tick
  office: (
    <>
      <ellipse cx="60" cy="99" rx="46" ry="5" fill={SHADOW} />
      <rect x="14" y="22" width="62" height="74" rx="4" fill={W} stroke={B} strokeWidth="3" />
      <path d="M14 46h62M14 70h62" stroke={B} strokeWidth="3" />
      <rect x="20" y="30" width="16" height="14" rx="2" fill={L} stroke={B} strokeWidth="2" />
      <rect x="40" y="33" width="12" height="11" rx="2" fill={A} />
      <rect x="22" y="56" width="20" height="12" rx="2" fill={P} stroke={B} strokeWidth="2" />
      <rect x="48" y="52" width="20" height="16" rx="2" fill={L} stroke={B} strokeWidth="2" />
      <rect x="24" y="78" width="14" height="14" rx="2" fill={A} fillOpacity=".7" />
      <g className="bob">
        <rect x="70" y="40" width="38" height="26" rx="6" fill={W} stroke={B} strokeWidth="3" />
        <circle cx="80" cy="53" r="3.5" fill={B} />
        <path d="M88 49h13M88 57h9" stroke={B} strokeWidth="2.5" strokeLinecap="round" />
        <circle className="pop" cx="104" cy="40" r="9" fill={G} />
        <path className="pop" d="m100 40 3 3 5-6" stroke={W} strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </g>
      <path className="twinkle" d="M96 16v8M92 20h8" stroke={A} strokeWidth="2.5" strokeLinecap="round" />
      <path className="twinkle t2" d="M8 14v6M5 17h6" stroke={B} strokeWidth="2" strokeLinecap="round" />
    </>
  ),
  // the campus: A and B buildings
  campus: (
    <>
      <ellipse cx="60" cy="99" rx="50" ry="5" fill={SHADOW} />
      <rect x="12" y="34" width="44" height="62" rx="3" fill={L} stroke={B} strokeWidth="3" />
      <rect x="62" y="20" width="46" height="76" rx="3" fill={P} stroke={B} strokeWidth="3" />
      <text x="34" y="50" textAnchor="middle" fontSize="13" fontWeight="700" fill={B}>A</text>
      <text x="85" y="36" textAnchor="middle" fontSize="13" fontWeight="700" fill={B}>B</text>
      <path d="M20 60h8M36 60h8M20 72h8M36 72h8M70 48h8M86 48h8M70 60h8M86 60h8M70 72h8M86 72h8" stroke={W} strokeWidth="5" />
      <rect x="28" y="82" width="12" height="14" fill={W} stroke={B} strokeWidth="2" />
      <rect x="79" y="82" width="12" height="14" fill={W} stroke={B} strokeWidth="2" />
      <g className="bob"><path d="M85 20V6" stroke={B} strokeWidth="2" /><path d="M85 6h12l-3 4 3 4H85z" fill={A} /></g>
      <circle className="twinkle" cx="8" cy="22" r="2.5" fill={A} />
    </>
  ),
  // a rising chart
  chart: (
    <>
      <ellipse cx="60" cy="99" rx="42" ry="5" fill={SHADOW} />
      <rect x="14" y="16" width="92" height="76" rx="8" fill={W} stroke={B} strokeWidth="3" />
      <rect className="grow1" x="26" y="62" width="12" height="20" rx="2" fill={L} stroke={B} strokeWidth="2" />
      <rect className="grow2" x="44" y="50" width="12" height="32" rx="2" fill={P} stroke={B} strokeWidth="2" />
      <rect className="grow3" x="62" y="40" width="12" height="42" rx="2" fill={L} stroke={B} strokeWidth="2" />
      <rect className="grow4" x="80" y="28" width="12" height="54" rx="2" fill={B} />
      <path className="pop" d="M28 52 50 40l16 6 22-20" stroke={A} strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path className="pop" d="m80 24 9 1-1 9" stroke={A} strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
};

export function Illustration({ name, size = 120, className = '' }: { name: keyof typeof ART | string; size?: number; className?: string }) {
  return (
    <svg className={'illus ' + className} viewBox="0 0 120 108" width={size} height={(size * 108) / 120} aria-hidden="true">
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

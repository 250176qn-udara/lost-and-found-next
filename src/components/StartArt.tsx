// Illustrations for the start screen and the sidebar, in the same flat style as the office scene (HeroArt):
// spot pictures for the two report tiles, and lost-and-found things drawn as stickers (a white edge around each
// shape, like a sticker sheet): handbag, round glasses, backpack, umbrella, keys, water bottle.
// Pure SVG, no hooks, all decorative (aria-hidden). Colours follow the brand palette in globals.css.
import type { CSSProperties } from 'react';

/** A four-point sparkle at (x, y). */
const Sparkle = ({ x, y, r = 6, c = '#F472B6' }: { x: number; y: number; r?: number; c?: string }) => (
  <path d={`M${x} ${y - r}q1 ${r - 1} ${r} ${r}q-${r - 1} 1-${r} ${r}q-1-${r - 1}-${r}-${r}q${r - 1}-1 ${r}-${r}z`} fill={c} className="sparkle" />
);

/** The white sticker edge: shapes inside get a thick white stroke painted under their fill. */
const EDGE = { stroke: '#fff', strokeWidth: 8, strokeLinejoin: 'round', strokeLinecap: 'round', paintOrder: 'stroke' } as const;

/** "Report lost item": a magnifying glass over a wallet that is not where it should be. */
export function LostArt({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 120 100" aria-hidden="true">
      <ellipse cx="54" cy="88" rx="40" ry="6" fill="#1E1B4B" opacity=".12" />
      <rect x="16" y="44" width="58" height="40" rx="9" fill="#F59E0B" />
      <rect x="16" y="44" width="58" height="15" rx="7" fill="#D97706" />
      <rect x="58" y="60" width="18" height="12" rx="4" fill="#FDE68A" />
      <circle cx="68" cy="66" r="2.5" fill="#B45309" />
      <circle cx="80" cy="40" r="23" fill="#fff" fillOpacity=".35" stroke="#4F46E5" strokeWidth="6" />
      <path d="M97 57l15 15" stroke="#4F46E5" strokeWidth="9" strokeLinecap="round" />
      <text x="80" y="50" textAnchor="middle" fontSize="28" fontWeight="800" fill="#4F46E5">?</text>
      <Sparkle x={22} y={24} r={6} c="#F472B6" />
      <Sparkle x={44} y={14} r={4} c="#34D399" />
      <Sparkle x={110} y={22} r={5} c="#FBBF24" />
    </svg>
  );
}

/** "Report / register found item": a found phone with its tag and a green check. */
export function FoundArt({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 120 100" aria-hidden="true">
      <ellipse cx="60" cy="90" rx="40" ry="6" fill="#1E1B4B" opacity=".12" />
      {/* open hand */}
      <path d="M22 84q0-18 18-20h40q16 0 16 14v8z" fill="#FCD9B6" />
      <path d="M28 66q-10-4-6-12t12 2" fill="#FCD9B6" />
      {/* phone */}
      <rect x="44" y="12" width="34" height="60" rx="7" fill="#1E293B" />
      <rect x="48" y="18" width="26" height="44" rx="3" fill="#38BDF8" />
      <rect x="52" y="24" width="18" height="4" rx="2" fill="#fff" opacity=".8" />
      <rect x="52" y="32" width="12" height="4" rx="2" fill="#fff" opacity=".6" />
      <circle cx="61" cy="67" r="2" fill="#94A3B8" />
      {/* tag */}
      <path d="M78 20l8 12" stroke="#94A3B8" strokeWidth="1.5" />
      <rect x="82" y="30" width="26" height="15" rx="3" fill="#fff" transform="rotate(-8 95 37)" />
      <text x="95" y="41" textAnchor="middle" fontSize="9" fontWeight="800" fill="#4F46E5" transform="rotate(-8 95 37)">07</text>
      {/* check badge */}
      <circle cx="98" cy="68" r="13" fill="#10B981" />
      <path d="m91.5 68 4.5 4.5 9-9" stroke="#fff" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <Sparkle x={24} y={22} r={5} c="#FBBF24" />
      <Sparkle x={34} y={40} r={3.5} c="#F472B6" />
      <Sparkle x={112} y={14} r={5} c="#34D399" />
    </svg>
  );
}

// ---------- stickers (viewBox 0 0 120 120; the outline shapes carry the white edge, details sit on top) ----------

/** A caramel handbag with two handles, a clasp and a little tag. */
export function BagSticker({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 120 120" aria-hidden="true">
      <g {...EDGE}>
        <path d="M38 52q0-30 22-30t22 30" fill="none" stroke="#fff" strokeWidth="18" />
        <rect x="16" y="50" width="88" height="54" rx="16" fill="#D97706" />
      </g>
      <path d="M38 52q0-30 22-30t22 30" fill="none" stroke="#92400E" strokeWidth="6" strokeLinecap="round" />
      <rect x="16" y="50" width="88" height="54" rx="16" fill="#D97706" />
      <rect x="16" y="50" width="88" height="18" rx="9" fill="#B45309" />
      <rect x="50" y="60" width="20" height="14" rx="5" fill="#FDE68A" />
      <circle cx="60" cy="67" r="3" fill="#92400E" />
      <path d="M30 76h60M30 86h60" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" opacity=".7" />
      <path d="M92 54l6 12" stroke="#92400E" strokeWidth="1.5" />
      <rect x="92" y="64" width="16" height="10" rx="2.5" fill="#fff" transform="rotate(-10 100 69)" />
      <path d="M26 94q6-6 12 0" stroke="#FBCFE8" strokeWidth="3" strokeLinecap="round" fill="none" />
    </svg>
  );
}

/** Round tortoiseshell glasses with pale blue lenses. */
export function GlassesSticker({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 120 120" aria-hidden="true">
      <g {...EDGE}>
        <circle cx="36" cy="64" r="22" fill="#78350F" />
        <circle cx="84" cy="64" r="22" fill="#78350F" />
        <path d="M14 58l-10-10M106 58l10-10" stroke="#fff" strokeWidth="14" />
      </g>
      <path d="M14 58l-10-10M106 58l10-10" stroke="#78350F" strokeWidth="5" strokeLinecap="round" />
      <circle cx="36" cy="64" r="22" fill="#78350F" />
      <circle cx="84" cy="64" r="22" fill="#78350F" />
      <circle cx="36" cy="64" r="16" fill="#BAE6FD" />
      <circle cx="84" cy="64" r="16" fill="#BAE6FD" />
      <path d="M58 60q2-8 4 0" fill="none" stroke="#78350F" strokeWidth="4" />
      <path d="M26 56q4-6 10-6M74 56q4-6 10-6" stroke="#fff" strokeWidth="3" strokeLinecap="round" opacity=".9" />
      <circle cx="30" cy="48" r="2" fill="#D97706" /><circle cx="90" cy="78" r="2" fill="#D97706" />
    </svg>
  );
}

/** A sky-blue school backpack with a front pocket and buckles. */
export function BackpackSticker({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 120 120" aria-hidden="true">
      <g {...EDGE}>
        <path d="M40 30q0-16 20-16t20 16" fill="none" stroke="#fff" strokeWidth="18" />
        <rect x="22" y="26" width="76" height="84" rx="22" fill="#60A5FA" />
      </g>
      <path d="M40 30q0-16 20-16t20 16" fill="none" stroke="#1D4ED8" strokeWidth="7" strokeLinecap="round" />
      <rect x="22" y="26" width="76" height="84" rx="22" fill="#60A5FA" />
      <path d="M22 60q38-14 76 0v-12q0-22-38-22t-38 22z" fill="#3B82F6" />
      <rect x="36" y="66" width="48" height="34" rx="10" fill="#2563EB" />
      <rect x="36" y="66" width="48" height="10" rx="5" fill="#1D4ED8" />
      <rect x="52" y="72" width="16" height="8" rx="3" fill="#FDE68A" />
      <path d="M34 48h10M76 48h10" stroke="#FDE68A" strokeWidth="5" strokeLinecap="round" />
      <circle cx="60" cy="40" r="3" fill="#fff" opacity=".8" />
    </svg>
  );
}

/** A pink umbrella with a scalloped edge and a wooden handle. */
export function UmbrellaSticker({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 120 120" aria-hidden="true">
      <g {...EDGE}>
        <path d="M10 62q50-60 100 0q-8-6-16 0q-9-6-17 0q-8-6-17 0q-8-6-17 0q-8-6-17 0q-8-6-16 0z" fill="#EC4899" />
        <path d="M60 62v38q0 10-10 10t-10-8" fill="none" stroke="#fff" strokeWidth="14" />
      </g>
      <path d="M60 62v38q0 10-10 10t-10-8" fill="none" stroke="#78350F" strokeWidth="5" strokeLinecap="round" />
      <path d="M10 62q50-60 100 0q-8-6-16 0q-9-6-17 0q-8-6-17 0q-8-6-17 0q-8-6-17 0q-8-6-16 0z" fill="#EC4899" />
      <path d="M27 62q10-44 33-44q-14 10-16 44zM60 18q23 0 33 44q-2-34-16-44z" fill="#F9A8D4" />
      <path d="M60 18v-8" stroke="#78350F" strokeWidth="4" strokeLinecap="round" />
      <circle cx="60" cy="8" r="3" fill="#FBBF24" />
    </svg>
  );
}

/** A key ring with two keys and a heart charm. */
export function KeysSticker({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 120 120" aria-hidden="true">
      <g {...EDGE}>
        <circle cx="42" cy="38" r="18" fill="none" stroke="#fff" strokeWidth="20" />
        <path d="M54 50l40 40M86 82l8-8M78 74l8-8" stroke="#fff" strokeWidth="20" />
        <path d="M34 54l-8 44M26 90l10 2M28 80l10 2" stroke="#fff" strokeWidth="18" />
        <path d="M62 24q8-12 16 0q4 8-8 18q-12-10-8-18z" fill="#F472B6" />
      </g>
      <circle cx="42" cy="38" r="18" fill="none" stroke="#F59E0B" strokeWidth="8" />
      <path d="M54 50l40 40M86 82l8-8M78 74l8-8" stroke="#FBBF24" strokeWidth="8" strokeLinecap="round" />
      <path d="M34 54l-8 44M26 90l10 2M28 80l10 2" stroke="#94A3B8" strokeWidth="7" strokeLinecap="round" />
      <path d="M62 24q8-12 16 0q4 8-8 18q-12-10-8-18z" fill="#F472B6" />
      <circle cx="36" cy="32" r="3" fill="#fff" opacity=".8" />
    </svg>
  );
}

/** A teal water bottle with a dark cap and a label. */
export function BottleSticker({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 120 120" aria-hidden="true">
      <g {...EDGE}>
        <rect x="44" y="8" width="32" height="18" rx="6" fill="#0F172A" />
        <rect x="36" y="24" width="48" height="90" rx="16" fill="#14B8A6" />
      </g>
      <rect x="44" y="8" width="32" height="18" rx="6" fill="#0F172A" />
      <rect x="36" y="24" width="48" height="90" rx="16" fill="#14B8A6" />
      <rect x="36" y="52" width="48" height="30" fill="#fff" opacity=".85" />
      <path d="M46 62h28M46 70h18" stroke="#0F766E" strokeWidth="3" strokeLinecap="round" />
      <path d="M44 34v60" stroke="#fff" strokeWidth="4" strokeLinecap="round" opacity=".45" />
    </svg>
  );
}

/** An amber wallet with a flap and a clasp. */
export function WalletSticker({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 120 120" aria-hidden="true">
      <g {...EDGE}><rect x="14" y="40" width="92" height="60" rx="12" fill="#F59E0B" /></g>
      <rect x="14" y="40" width="92" height="60" rx="12" fill="#F59E0B" />
      <rect x="14" y="40" width="92" height="22" rx="10" fill="#D97706" />
      <rect x="80" y="62" width="30" height="20" rx="6" fill="#FDE68A" />
      <circle cx="96" cy="72" r="4" fill="#B45309" />
      <path d="M26 82h30" stroke="#FDE68A" strokeWidth="3" strokeLinecap="round" opacity=".8" />
    </svg>
  );
}

/** A phone with a bright screen and a small item tag. */
export function PhoneSticker({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 120 120" aria-hidden="true">
      <g {...EDGE}><rect x="36" y="12" width="48" height="96" rx="10" fill="#1E293B" /></g>
      <rect x="36" y="12" width="48" height="96" rx="10" fill="#1E293B" />
      <rect x="42" y="20" width="36" height="74" rx="4" fill="#38BDF8" />
      <rect x="48" y="28" width="24" height="5" rx="2.5" fill="#fff" opacity=".85" />
      <rect x="48" y="38" width="16" height="5" rx="2.5" fill="#fff" opacity=".6" />
      <circle cx="60" cy="101" r="2.5" fill="#94A3B8" />
      <path d="M84 22l10 14" stroke="#94A3B8" strokeWidth="1.5" />
      <rect x="88" y="34" width="24" height="14" rx="3" fill="#fff" transform="rotate(-10 100 41)" />
    </svg>
  );
}

/** The stickers that sit in the bottom corners of the start screen. */
export function CornerStickers() {
  return (
    <>
      <div className="stickers left" aria-hidden="true"><BagSticker /><GlassesSticker /></div>
      <div className="stickers right" aria-hidden="true"><UmbrellaSticker /><BackpackSticker /></div>
    </>
  );
}

/** Lost-and-found things drifting in the background. */
export function Doodles() {
  const at = (s: Record<string, string>) => s as CSSProperties;
  return (
    <div className="doodles" aria-hidden="true">
      <span className="doodle" style={at({ left: '6%', top: '18%', '--d': '0s' })}><KeysSticker /></span>
      <span className="doodle" style={at({ right: '8%', top: '14%', '--d': '-3s' })}><BottleSticker /></span>
      <span className="doodle" style={at({ left: '12%', bottom: '34%', '--d': '-6s' })}><GlassesSticker /></span>
      <span className="doodle" style={at({ right: '14%', bottom: '30%', '--d': '-2s' })}><BagSticker /></span>
      <span className="doodle" style={at({ left: '64%', top: '2%', '--d': '-5s' })}><UmbrellaSticker /></span>
    </div>
  );
}

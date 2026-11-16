// Dashboard hero background: a lost-and-found office. A shelving unit, a coat hook, an umbrella stand and a
// hanging sign; the things on the shelves are the same sticker illustrations as the start screen and the menu
// (StartArt), so the whole app shares one set of pictures. It sits on the right of the banner (the text is on
// the left); the floor across the whole banner is drawn in CSS. No hooks.
import type { ReactNode } from 'react';
import { BackpackSticker, BagSticker, BottleSticker, GlassesSticker, KeysSticker, PhoneSticker, UmbrellaSticker, WalletSticker } from './StartArt';

const TAG = '#FFFFFF', STRING = 'rgba(255,255,255,.7)';

/** A small white item tag hanging from (x, y). */
function Tag({ x, y, n }: { x: number; y: number; n: string }) {
  return (
    <g>
      <path d={`M${x} ${y}l6 10`} stroke={STRING} strokeWidth="1.2" />
      <rect x={x + 1} y={y + 10} width="22" height="13" rx="2.5" fill={TAG} transform={`rotate(-8 ${x + 12} ${y + 16})`} />
      <text x={x + 12} y={y + 20} textAnchor="middle" fontSize="8" fontWeight="700" fill="#4F46E5" transform={`rotate(-8 ${x + 12} ${y + 16})`}>{n}</text>
    </g>
  );
}

/**
 * Places a sticker (a 120×120 drawing) inside the scene. `bottom` is the shelf line the picture stands on and
 * `art` is where the drawing's own bottom edge is in its 120-unit box, so every item sits exactly on its shelf.
 */
function Put({ x, size, bottom, art, children }: { x: number; size: number; bottom: number; art: number; children: ReactNode }) {
  return <svg x={x} y={bottom - (art / 120) * size} width={size} height={size} viewBox="0 0 120 120">{children}</svg>;
}

export function HeroArt({ sign }: { sign: string }) {
  return (
    <svg className="hero-scene" viewBox="660 0 780 400" preserveAspectRatio="xMaxYMax meet" aria-hidden="true">
      <defs>
        <radialGradient id="hs-lamp" cx="0.5" cy="0" r="0.8"><stop offset="0" stopColor="#fff" stopOpacity=".28" /><stop offset="1" stopColor="#fff" stopOpacity="0" /></radialGradient>
        <linearGradient id="hs-board" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#F1F5F9" /><stop offset="1" stopColor="#CBD5E1" /></linearGradient>
        <filter id="hs-sh" x="-10%" y="-10%" width="120%" height="140%"><feDropShadow dx="0" dy="6" stdDeviation="6" floodColor="#1E1B4B" floodOpacity=".35" /></filter>
      </defs>

      {/* wall panels and the light over the shelves */}
      <g stroke="#fff" strokeOpacity=".05" strokeWidth="2">
        {Array.from({ length: 18 }, (_, i) => <path key={i} d={`M${i * 80 + 40} 0v360`} />)}
      </g>
      <ellipse cx="1130" cy="30" rx="440" ry="300" fill="url(#hs-lamp)" />

      {/* hanging sign */}
      <path d="M1050 0v22M1220 0v22" stroke="#E0E7FF" strokeWidth="2" />
      <g filter="url(#hs-sh)">
        <rect x="1010" y="20" width="250" height="42" rx="10" fill="#fff" />
        <circle cx="1036" cy="41" r="10" fill="#4F46E5" />
        <circle cx="1034" cy="39" r="4.5" fill="none" stroke="#fff" strokeWidth="2" />
        <path d="m1037.5 42.5 3.5 3.5" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
        <text x="1143" y="47" textAnchor="middle" fontSize="18" fontWeight="800" letterSpacing=".06em" fill="#312E81">{sign}</text>
      </g>

      {/* shelving unit */}
      <rect x="866" y="78" width="540" height="282" fill="#fff" fillOpacity=".07" />
      <rect x="856" y="72" width="14" height="288" rx="3" fill="#CBD5E1" />
      <rect x="1402" y="72" width="14" height="288" rx="3" fill="#CBD5E1" />
      {[150, 250, 350].map(y => (
        <g key={y}>
          <rect x="850" y={y} width="572" height="10" rx="2" fill="url(#hs-board)" />
          <rect x="850" y={y + 10} width="572" height="4" fill="#1E1B4B" opacity=".25" />
        </g>
      ))}

      {/* top shelf: glasses, water bottle, keys, wallet, handbag */}
      <Put x={878} size={78} bottom={152} art={86}><GlassesSticker /></Put>
      <Put x={972} size={72} bottom={152} art={114}><BottleSticker /></Put>
      <Put x={1052} size={74} bottom={152} art={98}><KeysSticker /></Put>
      <Tag x={1112} y={98} n="12" />
      <Put x={1146} size={84} bottom={152} art={100}><WalletSticker /></Put>
      <Put x={1246} size={90} bottom={152} art={104}><BagSticker /></Put>
      <Tag x={1326} y={90} n="04" />

      {/* middle shelf: backpack, phone, handbag, open umbrella */}
      <Put x={874} size={104} bottom={252} art={110}><BackpackSticker /></Put>
      <Tag x={964} y={176} n="07" />
      <Put x={990} size={86} bottom={252} art={108}><PhoneSticker /></Put>
      <Put x={1092} size={110} bottom={252} art={104}><BagSticker /></Put>
      <Tag x={1192} y={178} n="23" />
      <Put x={1222} size={100} bottom={252} art={110}><UmbrellaSticker /></Put>
      <Put x={1326} size={70} bottom={252} art={114}><BottleSticker /></Put>

      {/* bottom shelf: labelled storage bins */}
      {[[884, '#6366F1'], [1016, '#38BDF8'], [1148, '#14B8A6'], [1280, '#F472B6']].map(([x, c]) => (
        <g key={x as number}>
          <rect x={x as number} y="292" width="114" height="58" rx="6" fill={c as string} />
          <rect x={x as number} y="292" width="114" height="10" rx="4" fill="#000" opacity=".12" />
          <rect x={(x as number) + 35} y="314" width="44" height="18" rx="3" fill="#fff" fillOpacity=".9" />
        </g>
      ))}

      {/* coat hook: a handbag and a key ring hang from the pegs */}
      <rect x="690" y="86" width="140" height="8" rx="4" fill="#CBD5E1" />
      <path d="M732 94v10M790 94v10" stroke="#94A3B8" strokeWidth="4" strokeLinecap="round" />
      <svg x="664" y="82" width="136" height="136" viewBox="0 0 120 120"><BagSticker /></svg>
      <Tag x={790} y={150} n="31" />
      <svg x="774" y="86" width="84" height="84" viewBox="0 0 120 120"><KeysSticker /></svg>

      {/* umbrella stand with three closed umbrellas */}
      <g stroke="#fff" strokeWidth="6" strokeLinejoin="round" strokeLinecap="round" paintOrder="stroke">
        <path d="M706 302q10-62 20 0z" fill="#EC4899" />
        <path d="M738 302q10-70 20 0z" fill="#38BDF8" />
        <path d="M768 302q10-56 20 0z" fill="#14B8A6" />
      </g>
      <path d="M716 300v-58q0-10 8-10t8 8" stroke="#78350F" strokeWidth="4" fill="none" strokeLinecap="round" />
      <path d="M748 300v-66q0-10-8-10t-8 8" stroke="#78350F" strokeWidth="4" fill="none" strokeLinecap="round" />
      <path d="M778 300v-52q0-10 8-10t8 8" stroke="#78350F" strokeWidth="4" fill="none" strokeLinecap="round" />
      <rect x="696" y="296" width="104" height="64" rx="8" fill="#334155" />
      <rect x="696" y="296" width="104" height="10" rx="5" fill="#475569" />
    </svg>
  );
}

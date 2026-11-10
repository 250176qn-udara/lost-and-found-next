// Dashboard hero background: a lost-and-found office. Shelves of found items with tags, a coat hook,
// an umbrella stand and a hanging sign. It sits on the right of the banner (the text is on the left);
// the floor across the whole banner is drawn in CSS. No hooks.

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

export function HeroArt({ sign }: { sign: string }) {
  return (
    <svg className="hero-scene" viewBox="660 0 780 400" preserveAspectRatio="xMaxYMax meet" aria-hidden="true">
      <defs>
        <radialGradient id="hs-lamp" cx="0.5" cy="0" r="0.8"><stop offset="0" stopColor="#fff" stopOpacity=".28" /><stop offset="1" stopColor="#fff" stopOpacity="0" /></radialGradient>
        <linearGradient id="hs-board" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#F1F5F9" /><stop offset="1" stopColor="#CBD5E1" /></linearGradient>
        <linearGradient id="hs-box" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#E2B47A" /><stop offset="1" stopColor="#C8925A" /></linearGradient>
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

      {/* top shelf: books, water bottle, bike helmet, headphones, box, cap */}
      <rect x="888" y="136" width="74" height="14" rx="2" fill="#F59E0B" />
      <rect x="894" y="122" width="66" height="14" rx="2" fill="#14B8A6" />
      <rect x="890" y="108" width="70" height="14" rx="2" fill="#EC4899" />
      <path d="M896 115h54M900 129h50M894 143h60" stroke="#fff" strokeOpacity=".5" strokeWidth="1.5" />
      <rect x="986" y="90" width="26" height="60" rx="8" fill="#38BDF8" />
      <rect x="990" y="79" width="18" height="13" rx="3" fill="#0F172A" />
      <rect x="989" y="110" width="20" height="18" rx="3" fill="#fff" fillOpacity=".35" />
      <path d="M1038 150q0-60 42-60t42 60z" fill="#F43F5E" />
      <path d="M1056 104q24-12 48 0M1050 122q30-12 60 0" stroke="#fff" strokeOpacity=".55" strokeWidth="4" strokeLinecap="round" fill="none" />
      <rect x="1034" y="144" width="92" height="7" rx="3" fill="#BE123C" />
      <Tag x={1112} y={98} n="12" />
      <path d="M1156 146v-18a26 26 0 0 1 52 0v18" stroke="#1E293B" strokeWidth="7" fill="none" strokeLinecap="round" />
      <rect x="1146" y="124" width="20" height="26" rx="7" fill="#334155" />
      <rect x="1198" y="124" width="20" height="26" rx="7" fill="#334155" />
      <rect x="1236" y="100" width="82" height="50" rx="3" fill="url(#hs-box)" />
      <path d="M1236 112h82" stroke="#A97440" strokeWidth="2" />
      <rect x="1266" y="100" width="22" height="14" fill="#F5D7A8" />
      <rect x="1250" y="124" width="40" height="16" rx="2" fill="#fff" fillOpacity=".85" />
      <path d="M1338 150q0-34 30-34t30 34z" fill="#6366F1" />
      <path d="M1334 150h40" stroke="#4338CA" strokeWidth="6" strokeLinecap="round" />

      {/* middle shelf: backpack, laptops, handbag, sneakers */}
      <path d="M906 172v-8a14 14 0 0 1 28 0v8" stroke="#047857" strokeWidth="5" fill="none" />
      <rect x="888" y="168" width="66" height="82" rx="20" fill="#10B981" />
      <rect x="898" y="206" width="46" height="32" rx="9" fill="#059669" />
      <path d="M906 214h30" stroke="#A7F3D0" strokeWidth="2" strokeLinecap="round" />
      <Tag x={946} y={176} n="07" />
      <rect x="982" y="236" width="112" height="14" rx="3" fill="#CBD5E1" />
      <rect x="986" y="224" width="104" height="12" rx="3" fill="#94A3B8" />
      <circle cx="1038" cy="230" r="2.5" fill="#E2E8F0" />
      <path d="M1130 206q0-26 31-26t31 26" stroke="#7E22CE" strokeWidth="5" fill="none" />
      <path d="M1110 250l9-48h84l9 48z" fill="#A855F7" />
      <path d="M1124 220h74" stroke="#E9D5FF" strokeWidth="2" opacity=".7" />
      <Tag x={1200} y={204} n="23" />
      <path d="M1238 250v-20q0-8 8-8h16l16 14h28q8 0 8 8v6z" fill="#fff" />
      <path d="M1238 244h76" stroke="#F59E0B" strokeWidth="4" />
      <path d="M1316 250v-20q0-8 8-8h16l16 14h28q8 0 8 8v6z" fill="#F8FAFC" />
      <path d="M1316 244h76" stroke="#0EA5E9" strokeWidth="4" />

      {/* bottom shelf: labelled storage bins */}
      {[[884, '#4F46E5'], [1016, '#0EA5E9'], [1148, '#14B8A6'], [1280, '#EC4899']].map(([x, c]) => (
        <g key={x as number}>
          <rect x={x as number} y="292" width="114" height="58" rx="6" fill={c as string} />
          <rect x={x as number} y="292" width="114" height="10" rx="4" fill="#000" opacity=".12" />
          <rect x={(x as number) + 35} y="314" width="44" height="18" rx="3" fill="#fff" fillOpacity=".9" />
        </g>
      ))}
      <circle cx="958" cy="274" r="18" fill="#F97316" />
      <path d="M940 274h36M958 256v36M945 261q13 13 0 26M971 261q-13 13 0 26" stroke="#9A3412" strokeWidth="1.5" fill="none" />

      {/* coat hook with a raincoat */}
      <rect x="690" y="86" width="140" height="8" rx="4" fill="#CBD5E1" />
      <path d="M732 94v10M790 94v10" stroke="#94A3B8" strokeWidth="4" strokeLinecap="round" />
      <path d="M722 104h74l32 30-14 16-12-10v66h-86v-66l-12 10-14-16z" fill="#FBBF24" />
      <path d="M742 104l18 22 18-22" fill="#F59E0B" />
      <path d="M760 126v90" stroke="#B45309" strokeWidth="2" strokeDasharray="4 4" />
      <rect x="722" y="168" width="22" height="16" rx="3" fill="#F59E0B" />
      <Tag x={804} y={150} n="31" />

      {/* umbrella stand */}
      <path d="M716 300v-58q0-10 8-10t8 8" stroke="#334155" strokeWidth="4" fill="none" strokeLinecap="round" />
      <path d="M706 302q10-62 20 0z" fill="#38BDF8" />
      <path d="M748 300v-66q0-10-8-10t-8 8" stroke="#334155" strokeWidth="4" fill="none" strokeLinecap="round" />
      <path d="M738 302q10-70 20 0z" fill="#F43F5E" />
      <path d="M778 300v-52q0-10 8-10t8 8" stroke="#334155" strokeWidth="4" fill="none" strokeLinecap="round" />
      <path d="M768 302q10-56 20 0z" fill="#A3E635" />
      <rect x="696" y="296" width="104" height="64" rx="8" fill="#334155" />
      <rect x="696" y="296" width="104" height="10" rx="5" fill="#475569" />
    </svg>
  );
}

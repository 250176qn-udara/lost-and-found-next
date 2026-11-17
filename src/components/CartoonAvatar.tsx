// A friendly cartoon face for each account, drawn in SVG (no image files, nothing to upload).
// The face is picked from the account id, so the same person always gets the same picture:
// skin tone, hairstyle, hair colour, eyes, glasses, shirt and background. No hooks: works in Server Components.

const BG = [['#C7D2FE', '#A5B4FC'], ['#BAE6FD', '#7DD3FC'], ['#A7F3D0', '#6EE7B7'], ['#FDE68A', '#FCD34D'], ['#FBCFE8', '#F9A8D4'], ['#DDD6FE', '#C4B5FD'], ['#FED7AA', '#FDBA74']];
const SKIN = ['#FDE2C8', '#F8D0AE', '#EDB98A', '#D39A6A', '#A86F45'];
const HAIR = ['#1F2937', '#3B2A20', '#6B3E1F', '#A0522D', '#E3B04B', '#2B3A67'];
const SHIRT = ['#4F46E5', '#0EA5E9', '#14B8A6', '#F43F5E', '#F59E0B', '#8B5CF6', '#10B981'];
const STYLES = ['short', 'bob', 'long', 'spiky', 'bun', 'curly', 'side'] as const;

/** Small deterministic random numbers from the seed (mulberry32). */
function rng(seed: number) {
  let a = (seed * 2654435761) >>> 0;
  return (n: number) => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return (((t ^ (t >>> 14)) >>> 0) % n);
  };
}

const shade = (hex: string, f: number) => {
  const n = parseInt(hex.slice(1), 16);
  const c = (v: number) => Math.max(0, Math.min(255, Math.round(v * f)));
  return `#${[(n >> 16) & 255, (n >> 8) & 255, n & 255].map(v => c(v).toString(16).padStart(2, '0')).join('')}`;
};

export function CartoonAvatar({ seed, size = 34, className }: { seed: number; size?: number; className?: string }) {
  const r = rng(seed + 7);
  let bgi = r(BG.length);
  const skin = SKIN[r(SKIN.length)];
  const hair = HAIR[r(HAIR.length)];
  // Blonde hair would vanish on the yellow / orange backgrounds: move to another colour.
  if (hair === '#E3B04B' && (bgi === 3 || bgi === 6)) bgi = (bgi + 2) % BG.length;
  const [bg1, bg2] = BG[bgi];
  const shirt = SHIRT[r(SHIRT.length)];
  const style = STYLES[r(STYLES.length)];
  const happyEyes = r(3) === 0;
  const glasses = r(5) === 0;
  const openSmile = r(2) === 0;
  const id = `cav${seed}`;
  const skinDk = shade(skin, 0.88);

  // Hair drawn behind the head (long styles) and in front of it (fringe / top).
  const back: Record<string, string | null> = {
    long: 'M17 28C15 46 18 56 23 58H41C46 56 49 46 47 28Z',
    bob: 'M17 29C16 40 18 45 22 45H42C46 45 48 40 47 29Z',
    side: 'M18 28C17 38 18 42 20 43H24V30Z',
    short: null, spiky: null, bun: null, curly: null,
  };
  const front: Record<string, string> = {
    short: 'M19 29C18 17 25 12 32.5 12C40 12 46.5 17 45 29C42 23 36.5 21 30 21.5C25 22 21 24.5 19 29Z',
    bob: 'M18 30C17 17 25 12 32 12C40 12 47 17 46 30C44 24 40 20.5 32 20.5C24.5 20.5 20 24 18 30Z',
    long: 'M18 29C17 17 25 12 32 12C40 12 47 17 46 29C43 22.5 39 20 34 20.5C33 23 29 25.5 24 26C21.5 26.5 19.5 27.5 18 29Z',
    spiky: 'M19 29L18.5 19L22.5 21L23 13.5L27.5 17.5L30 11L33.5 16.5L37.5 11.5L39 17.5L44 14.5L43.5 21L46 20L45 29C42 23 37 21.5 32 21.5C26.5 21.5 21.5 23.5 19 29Z',
    bun: 'M19 29C18 17 25 12.5 32 12.5C39.5 12.5 46.5 17 45 29C42 23.5 37 21.5 32 21.5C27 21.5 22 23.5 19 29Z',
    curly: 'M19 29C17 22 19 17 23 15.5C24.5 12.5 28 11.5 30.5 12.5C32.5 10.5 36.5 11 38.5 13C42 13 45.5 16.5 45.5 20.5C46.5 23 46 26 45 29C42 23.5 37 21.5 32 21.5C27 21.5 22 23.5 19 29Z',
    side: 'M18 30C17 18 24 12 32.5 12C40.5 12 46.5 17 45.5 27C41 21.5 35 19.5 28.5 20.5C24 21 20.5 24.5 18 30Z',
  };

  return (
    <svg className={className} width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <defs>
        <linearGradient id={`${id}b`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={bg1} /><stop offset="1" stopColor={bg2} /></linearGradient>
        <clipPath id={`${id}c`}><circle cx="32" cy="32" r="32" /></clipPath>
      </defs>
      <g clipPath={`url(#${id}c)`}>
        <rect width="64" height="64" fill={`url(#${id}b)`} />
        {back[style] && <path d={back[style]!} fill={hair} />}
        {/* neck and shirt */}
        <rect x="27" y="38" width="10" height="10" rx="3" fill={skinDk} />
        <path d="M8 66C9 52 19 46 32 46C45 46 55 52 56 66Z" fill={shirt} />
        <path d="M26.5 46.5L32 52L37.5 46.5" fill="none" stroke="#fff" strokeOpacity=".7" strokeWidth="2" strokeLinejoin="round" />
        {/* head */}
        <circle cx="19.5" cy="31.5" r="3" fill={skinDk} />
        <circle cx="44.5" cy="31.5" r="3" fill={skinDk} />
        <ellipse cx="32" cy="30" rx="13" ry="14" fill={skin} />
        {style === 'bun' && <circle cx="32" cy="10.5" r="5.5" fill={hair} />}
        <path d={front[style]} fill={hair} />
        {/* face */}
        {happyEyes ? (
          <g fill="none" stroke="#1F2937" strokeWidth="1.8" strokeLinecap="round">
            <path d="M25 31.5Q27 29 29 31.5" /><path d="M35 31.5Q37 29 39 31.5" />
          </g>
        ) : (
          <g>
            <ellipse cx="27" cy="31" rx="1.8" ry="2.3" fill="#1F2937" /><ellipse cx="37" cy="31" rx="1.8" ry="2.3" fill="#1F2937" />
            <circle cx="27.6" cy="30.2" r=".6" fill="#fff" /><circle cx="37.6" cy="30.2" r=".6" fill="#fff" />
          </g>
        )}
        {glasses && (
          <g fill="none" stroke="#334155" strokeWidth="1.4">
            <circle cx="27" cy="31" r="4" /><circle cx="37" cy="31" r="4" /><path d="M31 31h2M23 30.5l-3-1M41 30.5l3-1" />
          </g>
        )}
        <circle cx="23" cy="35.5" r="2.2" fill="#F472B6" opacity=".35" />
        <circle cx="41" cy="35.5" r="2.2" fill="#F472B6" opacity=".35" />
        {openSmile
          ? <path d="M28 36.5Q32 41.5 36 36.5Z" fill="#9F1239" stroke="#9F1239" strokeWidth="1" strokeLinejoin="round" />
          : <path d="M28.5 37Q32 40 35.5 37" fill="none" stroke="#9F1239" strokeWidth="1.8" strokeLinecap="round" />}
      </g>
    </svg>
  );
}

// Line icons (24×24, stroke = currentColor). No hooks, so they work in Server and Client Components.
import type { CSSProperties } from 'react';

const P: Record<string, string> = {
  home: 'M3 11.5 12 4l9 7.5M5.5 9.5V20h13V9.5M10 20v-5h4v5',
  plus: 'M12 5v14M5 12h14',
  box: 'M3.5 7.5 12 3l8.5 4.5v9L12 21l-8.5-4.5zM3.5 7.5 12 12l8.5-4.5M12 12v9',
  search: 'M10.5 17a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13zM20 20l-4.8-4.8',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4.5 20.5c1.2-3.6 4-5.5 7.5-5.5s6.3 1.9 7.5 5.5',
  desk: 'M3 10h18M5 10v10M19 10v10M8 6h8l1 4H7zM9 14h6',
  inbox: 'M3.5 13.5 6 5h12l2.5 8.5V19h-17zM3.5 13.5h5l1.5 2.5h4l1.5-2.5h5',
  list: 'M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01',
  shelf: 'M4 3v18M20 3v18M4 9h16M4 15h16M7 6h4M13 12h4M7 18h5',
  chart: 'M4 20V10M10 20V4M16 20v-7M21 20H3',
  pie: 'M12 3a9 9 0 1 0 9 9h-9zM15 3.5A8 8 0 0 1 20.5 9H15z',
  users: 'M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM2.5 20c.9-3 3.4-4.8 6.5-4.8s5.6 1.8 6.5 4.8M16 4.3a3.5 3.5 0 0 1 0 6.4M18 15.6c1.7.7 2.9 2.2 3.5 4.4',
  gear: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 13.5l1.6 1.2-2 3.4-1.9-.7a7 7 0 0 1-1.7 1l-.3 2h-4l-.3-2a7 7 0 0 1-1.7-1l-1.9.7-2-3.4 1.6-1.2a7 7 0 0 1 0-3L3.4 9.3l2-3.4 1.9.7a7 7 0 0 1 1.7-1l.3-2h4l.3 2a7 7 0 0 1 1.7 1l1.9-.7 2 3.4-1.6 1.2a7 7 0 0 1 0 3z',
  globe: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM3 12h18M12 3c2.5 2.7 2.5 15.3 0 18M12 3c-2.5 2.7-2.5 15.3 0 18',
  bell: 'M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15zM10 20.5a2 2 0 0 0 4 0',
  map: 'M9 4 3.5 6v14L9 18l6 2 5.5-2V4L15 6zM9 4v14M15 6v14',
  grid: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z',
  chevron: 'm9 6 6 6-6 6',
  check: 'm5 12.5 4.5 4.5L19 7.5',
  clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2',
  shield: 'M12 3 4.5 6v5.5c0 4.6 3.2 8.2 7.5 9.5 4.3-1.3 7.5-4.9 7.5-9.5V6zM8.5 12l2.5 2.5 4.5-5',
  pin: 'M12 21s-6.5-6-6.5-11a6.5 6.5 0 0 1 13 0c0 5-6.5 11-6.5 11zM12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z',
  ticket: 'M3.5 7.5h17v3a2 2 0 0 0 0 3v3h-17v-3a2 2 0 0 0 0-3zM14 7.5v9',
  hand: 'M7 11V6.5a1.5 1.5 0 0 1 3 0V11M10 10V4.5a1.5 1.5 0 0 1 3 0V10M13 10V5.5a1.5 1.5 0 0 1 3 0V12M16 9.5a1.5 1.5 0 0 1 3 0V14c0 4-2.7 7-6.5 7-3 0-4.5-1.5-6-4L4 13.5a1.5 1.5 0 0 1 2.6-1.5L7 12.5',
  alert: 'M12 4 2.5 20h19zM12 10v4.5M12 17.5h.01',
  out: 'M14 4h5v16h-5M10 16l4-4-4-4M14 12H4',
  scan: 'M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3M4 12h16',
  // item categories
  wallet: 'M4 7.5h14.5a1.5 1.5 0 0 1 1.5 1.5v9a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18V6a1.5 1.5 0 0 1 1.5-1.5H16v3M16 13.5h1.5',
  bag: 'M5 8h14l-1 12H6zM9 8V6.5a3 3 0 0 1 6 0V8',
  electronics: 'M7 3.5h10a1 1 0 0 1 1 1v15a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1v-15a1 1 0 0 1 1-1zM10.5 17.5h3',
  idcard: 'M3.5 6h17v12h-17zM8.5 12.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM5.8 15.5c.5-1.3 1.5-2 2.7-2s2.2.7 2.7 2M14 10h4M14 13h3',
  keys: 'M8 15a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM11 11h9.5M17 11v3M20 11v2',
  other: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6v.6M12 17h.01',
};

export function Icon({ name, size = 18, style, className }: { name: string; size?: number; style?: CSSProperties; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={1.8}
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={style} className={className}>
      <path d={P[name] ?? P.other} />
    </svg>
  );
}

const CAT_ICON: Record<string, string> = { Wallet: 'wallet', Bag: 'bag', Electronics: 'electronics', 'ID card': 'idcard', Keys: 'keys', Other: 'other' };
const CAT_TINT: Record<string, [bg: string, fg: string]> = {
  Wallet: ['#fef3c7', '#b45309'], Bag: ['#e0e7ff', '#4338ca'], Electronics: ['#dbeafe', '#1d4ed8'],
  'ID card': ['#fce7f3', '#be185d'], Keys: ['#dcfce7', '#15803d'], Other: ['#f1f5f9', '#475569'],
};

/** A coloured tile with the category's picture. Used instead of a photo. */
export function CategoryArt({ category, size = 44, big = false }: { category: string; size?: number; big?: boolean }) {
  const [bg, fg] = CAT_TINT[category] ?? CAT_TINT.Other;
  return (
    <span className={'catart' + (big ? ' big' : '')} style={{ background: bg, color: fg, width: big ? '100%' : size, height: big ? undefined : size }}>
      <Icon name={CAT_ICON[category] ?? 'other'} size={big ? 46 : Math.round(size * 0.5)} />
    </span>
  );
}

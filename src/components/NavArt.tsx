// Small pastel illustrations for the menu, so each page is easy to recognise (instead of thin line icons).
import type { ReactNode } from 'react';

const O = '#9A6B55';          // soft brown outline
const PEACH = '#FFD8C7', CORAL = '#F6A18C', MINT = '#C9DED2', SAGE = '#A9C7B5', YEL = '#F8D99B', BLUE = '#C7D8E8', W = '#FFF9F1', LAV = '#E3D5EE';
const s = { stroke: O, strokeWidth: 1.6, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const };

const ART: Record<string, ReactNode> = {
  // Dashboard: a little house
  home: <><path d="M7.5 14v12.5h17V14" fill={W} {...s} /><path d="M4 15.5 16 5.5l12 10z" fill={CORAL} {...s} /><path d="M9 12.5 16 7l7 5.5" stroke={W} strokeWidth="1.6" strokeLinecap="round" fill="none" opacity=".8" /><rect x="13.5" y="19" width="5" height="7.5" rx="1.5" fill={YEL} {...s} /><rect x="19.5" y="17" width="3.5" height="3.5" rx="1" fill={BLUE} {...s} /></>,
  // Report an item: clipboard with a plus
  plus: <><rect x="7" y="6" width="18" height="22" rx="3" fill={W} {...s} /><rect x="12" y="4" width="8" height="5" rx="2" fill={SAGE} {...s} /><circle cx="16" cy="18" r="6" fill={CORAL} {...s} /><path d="M16 15v6M13 18h6" stroke={W} strokeWidth="2" strokeLinecap="round" /></>,
  // Found items: a box of found things under a magnifier
  grid: <><path d="M4 16h17v10H4z" fill={YEL} {...s} /><path d="M4 16l3-4h11l3 4" fill="#FCE8C0" {...s} /><path d="M8 16V9.5a3.5 3.5 0 0 1 7 0" fill="none" stroke="#6E8FB0" strokeWidth="1.8" strokeLinecap="round" /><path d="M16 14.5v-3.5" stroke={O} strokeWidth="1.6" /><circle cx="22" cy="12" r="6" fill={W} fillOpacity=".9" {...s} /><path d="m26.3 16.3 3 3" stroke={O} strokeWidth="2.4" strokeLinecap="round" /><circle cx="22" cy="12" r="2" fill={MINT} /></>,
  // My items: my backpack with a heart
  box: <><path d="M11 9V7.5a5 5 0 0 1 10 0V9" fill="none" {...s} /><rect x="7" y="9" width="18" height="19" rx="6" fill={PEACH} {...s} /><rect x="10" y="18" width="12" height="7" rx="2.5" fill={CORAL} {...s} /><path d="M16 16.2c-1-2-4-1.3-3.4.6.4 1.2 3.4 2.6 3.4 2.6s3-1.4 3.4-2.6c.6-1.9-2.4-2.6-3.4-.6z" fill={W} transform="translate(0 -4)" /></>,
  // Messages: two speech bubbles
  chat: <><path d="M4 7h15a3 3 0 0 1 3 3v6a3 3 0 0 1-3 3H10l-4 3.5V19H4z" fill={MINT} {...s} /><path d="M13 15h12a3 3 0 0 1 3 3v5a3 3 0 0 1-3 3h-1v3l-4-3h-7a3 3 0 0 1-3-3z" fill={PEACH} {...s} /><circle cx="9" cy="12.5" r="1.1" fill={O} /><circle cx="13" cy="12.5" r="1.1" fill={O} /><circle cx="17" cy="12.5" r="1.1" fill={O} /></>,
  // Notifications: a bell
  bell: <><path d="M9 21v-7a7 7 0 0 1 14 0v7l2 3H7z" fill={YEL} {...s} /><path d="M13 25.5a3 3 0 0 0 6 0" fill={CORAL} {...s} /><path d="M12 12.5a4 4 0 0 1 3-3" stroke={W} strokeWidth="1.8" strokeLinecap="round" fill="none" /><circle cx="24" cy="8" r="3" fill={CORAL} {...s} /></>,
  // Thank-you wall: a heart with sparkles
  heart: <><path d="M16 27s-10-6-11.5-12C3.3 10 6.5 6.5 10 6.5c2.6 0 4.6 1.6 6 3.6 1.4-2 3.4-3.6 6-3.6 3.5 0 6.7 3.5 5.5 8.5C26 21 16 27 16 27z" fill={CORAL} {...s} /><path d="M9.5 11.5a3 3 0 0 1 2.5-1.8" stroke={W} strokeWidth="1.8" strokeLinecap="round" fill="none" /><path d="M27 4v4M25 6h4" stroke="#E8B84A" strokeWidth="1.6" strokeLinecap="round" /></>,
  // Account: a smiling face
  user: <><circle cx="16" cy="16" r="11" fill={PEACH} {...s} /><circle cx="12.3" cy="14.5" r="1.4" fill={O} /><circle cx="19.7" cy="14.5" r="1.4" fill={O} /><path d="M12.5 19q3.5 3 7 0" fill="none" {...s} /><ellipse cx="9.8" cy="18.5" rx="1.8" ry="1.1" fill={CORAL} /><ellipse cx="22.2" cy="18.5" rx="1.8" ry="1.1" fill={CORAL} /></>,
  // How it works: open book with a light bulb
  other: <><path d="M4 10c4-1.5 8-1.5 12 .5v16c-4-2-8-2-12-.5z" fill={W} {...s} /><path d="M28 10c-4-1.5-8-1.5-12 .5v16c4-2 8-2 12-.5z" fill={MINT} {...s} /><circle cx="22" cy="7" r="4" fill={YEL} {...s} /><path d="M21 11.5h2" stroke={O} strokeWidth="1.6" strokeLinecap="round" /></>,
  // Front desk: a service bell on a counter
  desk: <><path d="M4 24h24" stroke={O} strokeWidth="2" strokeLinecap="round" /><path d="M7 22a9 9 0 0 1 18 0z" fill={YEL} {...s} /><circle cx="16" cy="11.5" r="1.8" fill={CORAL} {...s} /><path d="M11 18a5 5 0 0 1 3-3" stroke={W} strokeWidth="1.8" strokeLinecap="round" fill="none" /></>,
  // Intake: an in-tray with a parcel
  inbox: <><path d="M4 18l4-10h16l4 10v7H4z" fill={BLUE} {...s} /><path d="M4 18h7l2 3h6l2-3h7" fill="none" {...s} /><rect x="12" y="9" width="8" height="7" rx="1.5" fill={PEACH} {...s} /></>,
  // Item list: clipboard with ticks
  list: <><rect x="7" y="5" width="18" height="23" rx="3" fill={W} {...s} /><path d="M10 11l1.5 1.5L14 10M10 17l1.5 1.5L14 16M10 23l1.5 1.5L14 22" stroke={SAGE} strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" /><path d="M16.5 11.5h5M16.5 17.5h5M16.5 23.5h5" stroke={O} strokeWidth="1.6" strokeLinecap="round" /></>,
  // Storage: a shelf with boxes
  shelf: <><path d="M5 4v24M27 4v24M5 15h22M5 26h22" stroke={O} strokeWidth="1.8" strokeLinecap="round" /><rect x="8" y="8" width="7" height="7" rx="1.5" fill={PEACH} {...s} /><rect x="17" y="10" width="6" height="5" rx="1.5" fill={YEL} {...s} /><rect x="10" y="19" width="9" height="7" rx="1.5" fill={MINT} {...s} /></>,
  // Overview: a bar chart
  chart: <><rect x="4" y="5" width="24" height="22" rx="4" fill={W} {...s} /><rect x="8" y="17" width="4" height="6" rx="1" fill={MINT} {...s} /><rect x="14" y="13" width="4" height="10" rx="1" fill={YEL} {...s} /><rect x="20" y="9" width="4" height="14" rx="1" fill={CORAL} {...s} /></>,
  // People: two people
  users: <><circle cx="12" cy="11" r="4.5" fill={PEACH} {...s} /><path d="M4 26c0-5 3.5-8 8-8s8 3 8 8z" fill={MINT} {...s} /><circle cx="22" cy="12" r="3.8" fill={YEL} {...s} /><path d="M19 19.5c1-.7 2-1 3-1 4 0 6.5 2.6 6.5 7H21" fill={BLUE} {...s} /></>,
  // Insights: a pie chart
  pie: <><circle cx="15" cy="17" r="10" fill={MINT} {...s} /><path d="M15 17V7a10 10 0 0 1 10 10z" fill={CORAL} {...s} /><path d="M15 17h10a10 10 0 0 1-3 7z" fill={YEL} {...s} /></>,
  // Settings: a gear
  gear: <><path d="M16 4l2.2 3.2 3.8-.8.8 3.8L26 12.4l-1.6 3.6L26 19.6l-3.2 2.2-.8 3.8-3.8-.8L16 28l-2.2-3.2-3.8.8-.8-3.8L6 19.6 7.6 16 6 12.4l3.2-2.2.8-3.8 3.8.8z" fill={BLUE} {...s} /><circle cx="16" cy="16" r="4.5" fill={W} {...s} /></>,
  // Platform: a globe
  globe: <><circle cx="16" cy="16" r="11" fill={BLUE} {...s} /><path d="M9 11c3 1 4 4 2.5 6.5S12 23 14 25M19 6c-1 3 1 5 4 5s4 3 2.5 6" fill={SAGE} stroke={O} strokeWidth="1.4" strokeLinecap="round" /></>,
};

/** The menu picture for an icon name, or null when there is none (the plain line icon is used then). */
export function NavArt({ name, size = 30 }: { name: string; size?: number }) {
  const art = ART[name];
  if (!art) return null;
  return <svg className="navart" viewBox="0 0 32 32" width={size} height={size} aria-hidden="true">{art}</svg>;
}

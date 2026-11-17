'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { NAV } from '@/lib/constants';
import type { Role } from '@/lib/types';
import { Icon } from './Icon';
import { FoundArt, LostArt } from './StartArt';
import { useT } from './Providers';

/** Splits a menu href into its path and query, e.g. "/report?kind=found" → ["/report", {kind: "found"}]. */
function parse(href: string): [string, URLSearchParams] {
  const i = href.indexOf('?');
  return i < 0 ? [href, new URLSearchParams()] : [href.slice(0, i), new URLSearchParams(href.slice(i + 1))];
}

/** badges: a number shown next to a menu entry (by href), e.g. claims waiting for a staff check. */
export function Nav({ role, badges = {} }: { role: Role; badges?: Record<string, number> }) {
  const t = useT();
  const path = usePathname();
  const search = useSearchParams();
  const groups = NAV[role];

  // How well a menu link matches the current page: -1 = not this page, otherwise the number of query values it also matches.
  // Links that share a path (e.g. /report and /report?kind=found) compete: only the best score is highlighted (on a tie, the first one).
  const score = (href: string) => {
    const [p, q] = parse(href);
    if (!(path === p || path.startsWith(p + '/'))) return -1;
    let n = 0;
    for (const [k, v] of q) { if (search.get(k) !== v) return -1; n++; }
    return n;
  };
  const winner = new Map<string, [href: string, score: number]>();
  for (const g of groups) for (const [href] of g.links) {
    const [p] = parse(href);
    const s = score(href);
    if (s >= 0 && s > (winner.get(p)?.[1] ?? -1)) winner.set(p, [href, s]);
  }
  const isOn = (href: string) => winner.get(parse(href)[0])?.[0] === href;

  return (
    <nav>
      {groups.map(g => (
        <div key={g.group}>
          <div className="navgroup">{t(g.group)}</div>
          {g.links.map(([href, label, icon]) => (
            href.endsWith('.html')
              // A static page (the interactive guide), not an app route.
              ? <a key={href} href={href}><Icon name={icon} size={18} />{t(label)}</a>
              : g.cta
                // The two report shortcuts: small versions of the start-screen cards, with their picture instead of an icon.
                ? <Link key={href} href={href} className={'cta' + (isOn(href) ? ' on' : '')}>
                    <span className="nav-lbl">{t(label)}</span>
                    {href === '/report' ? <LostArt className="nav-art" /> : <FoundArt className="nav-art" />}
                  </Link>
                : <Link key={href} href={href} className={isOn(href) ? 'on' : ''}>
                    <Icon name={icon} size={18} />{t(label)}
                    {(badges[href] ?? 0) > 0 && <span className="count">{badges[href]}</span>}
                  </Link>
          ))}
        </div>
      ))}
    </nav>
  );
}

'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { NAV } from '@/lib/constants';
import type { Role } from '@/lib/types';
import { Icon } from './Icon';
import { useT } from './Providers';

export function Nav({ role }: { role: Role }) {
  const t = useT();
  const path = usePathname();
  const search = useSearchParams();
  // "/report" and "/report?kind=found" are separate entries: a link with a query is on only when the query matches.
  const isOn = (href: string) => {
    const [p, q] = href.split('?');
    if (!(path === p || path.startsWith(p + '/'))) return false;
    const want = new URLSearchParams(q ?? '');
    if ([...want].length) return [...want].every(([k, v]) => search.get(k) === v);
    return !(p === '/report' && search.get('kind') === 'found');
  };
  return (
    <nav>
      {NAV[role].map(g => (
        <div key={g.group}>
          <div className="navgroup">{t(g.group)}</div>
          {g.links.map(([href, label, icon]) => (
            href.endsWith('.html')
              // A static page (the interactive guide), not an app route.
              ? <a key={href} href={href}><Icon name={icon} size={18} />{t(label)}</a>
              : <Link key={href} href={href} className={isOn(href) ? 'on' : ''}>
                  <Icon name={icon} size={18} />{t(label)}
                </Link>
          ))}
        </div>
      ))}
    </nav>
  );
}

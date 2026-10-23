'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NAV } from '@/lib/constants';
import type { Role } from '@/lib/types';
import { Icon } from './Icon';
import { NavArt } from './NavArt';
import { useT } from './Providers';

export function Nav({ role }: { role: Role }) {
  const t = useT();
  const path = usePathname();
  const isOn = (href: string) => path === href || path.startsWith(href + '/');
  return (
    <nav>
      {NAV[role].map(g => (
        <div key={g.group}>
          <div className="navgroup">{t(g.group)}</div>
          {g.links.map(([href, label, icon]) => (
            href.endsWith('.html')
              // A static page (the interactive guide), not an app route.
              ? <a key={href} href={href}>{NavArt({ name: icon }) ?? <Icon name={icon} size={18} />}{t(label)}</a>
              : <Link key={href} href={href} className={isOn(href) ? 'on' : ''}>
                  {NavArt({ name: icon }) ?? <Icon name={icon} size={18} />}{t(label)}
                </Link>
          ))}
        </div>
      ))}
    </nav>
  );
}

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NAV } from '@/lib/constants';
import type { Role } from '@/lib/types';
import { Icon } from './Icon';
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
            <Link key={href} href={href} className={isOn(href) ? 'on' : ''}>
              <Icon name={icon} size={18} />{t(label)}
            </Link>
          ))}
        </div>
      ))}
    </nav>
  );
}

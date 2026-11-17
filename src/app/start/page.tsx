import type { CSSProperties } from 'react';
import Link from 'next/link';
import { requirePage, startPath } from '@/lib/auth';
import { NAV, POSITION } from '@/lib/constants';
import { getClaimsQueue } from '@/lib/data';
import { one } from '@/lib/db';
import { getT } from '@/lib/i18n-server';
import { getPoints } from '@/lib/points';
import { Icon } from '@/components/Icon';
import { LangButton, UserPill } from '@/components/HeaderControls';
import { CornerStickers, Doodles, FoundArt, LostArt } from '@/components/StartArt';
import { BrandMark } from '@/components/BrandMark';
import { CartoonAvatar } from '@/components/CartoonAvatar';

/** Label of the page a role lands on when it skips the start screen. */
const START_LABEL = { member: 'Dashboard', staff: 'Front desk', admin: 'Overview', super: 'Platform' } as const;

/**
 * Start screen, shown right after login and when the app is opened at "/": the whole menu as a grid of
 * animated tiles, with the person's profile (initials, name, role, organization) behind and above it.
 * No sidebar here on purpose: this page *is* the menu. Any tile leads into the normal app shell.
 */
export default async function StartPage() {
  const { user } = await requirePage({ membership: true });
  const orgId = user.organizationId!;
  const office = user.role === 'staff' || user.role === 'admin';
  const [t, org, points, claims] = await Promise.all([
    getT(),
    one<{ name: string }>('SELECT name FROM organizations WHERE id = ?', [orgId]),
    user.role === 'member' ? getPoints(user.id, orgId) : null,
    office ? getClaimsQueue(orgId) : [],
  ]);
  // Shown on the "Claims" tile: how many are waiting for a staff check.
  const badges: Record<string, number> = { '/desk?tab=verify': claims.filter(c => c.status === 'pending').length };
  const hour = Number(new Date().toLocaleString('en-US', { hour: 'numeric', hour12: false, timeZone: 'Asia/Tokyo' }));
  const greeting = hour < 11 ? 'Good morning, {name}' : hour < 18 ? 'Good afternoon, {name}' : 'Good evening, {name}';
  // The person is shown by their position (Admin / Staff / Member), not their name.
  const position = t(POSITION[user.role]);
  // Every menu entry of this role, in sidebar order. The highlighted "report" group comes first and gets wide tiles.
  const tiles = NAV[user.role].flatMap(g => g.links.map(([href, label, icon]) => ({ href, label, icon, group: g.group, cta: !!g.cta })));

  return (
    <div className="launch">
      <header className="launch-bar">
        <div className="brand"><BrandMark /><span>{t('Lost & Found')}</span></div>
        <span className="grow" />
        <LangButton />
        <UserPill role={user.role} uid={user.id} />
      </header>

      {/* Position watermark behind the grid, drifting lost-and-found things, and item stickers in the bottom corners.
          All decorative: the same facts are in the card below. */}
      <div className="launch-bg" aria-hidden="true">
        <span className="launch-ava"><CartoonAvatar seed={user.id} size={260} /></span>
        <span className="launch-name">{position}</span>
      </div>
      <Doodles />
      <CornerStickers />

      <main className="launch-main">
        <section className="launch-me">
          <span className={'avatar cartoon pos-' + user.role} aria-hidden="true"><CartoonAvatar seed={user.id} size={58} /></span>
          <div>
            <h1>{t(greeting, { name: position })}</h1>
            <p className="meta">
              {org ? t(org.name) : position}
              {points && <> · {points.total} {t('points')} · {t(points.level.name)}</>}
            </p>
          </div>
        </section>

        <h2>{t('Where do you want to go?')}</h2>
        <div className="launch-grid">
          {tiles.map((x, i) => {
            const style = { '--i': i } as CSSProperties;
            const inner = (
              <>
                <span className="tile-ico"><Icon name={x.icon} size={x.cta ? 30 : 26} /></span>
                <span className="tile-txt"><b>{t(x.label)}</b><small>{t(x.group)}</small></span>
                {(badges[x.href] ?? 0) > 0 && <span className="count">{badges[x.href]}</span>}
                {/* the two report tiles carry a picture: a lost wallet under the magnifier, or a found phone with its tag */}
                {x.cta && (x.href === '/report' ? <LostArt className="tile-art" /> : <FoundArt className="tile-art" />)}
              </>
            );
            const cls = 'tile' + (x.cta ? ' cta' : '');
            // The interactive guide is a static page, not an app route.
            return x.href.endsWith('.html')
              ? <a key={x.href} href={x.href} className={cls} style={style}>{inner}</a>
              : <Link key={x.href} href={x.href} className={cls} style={style}>{inner}</Link>;
          })}
        </div>

        <p className="launch-skip">
          <Link href={startPath(user)}>{t('Skip to {page}', { page: t(START_LABEL[user.role]) })} →</Link>
        </p>
      </main>
    </div>
  );
}

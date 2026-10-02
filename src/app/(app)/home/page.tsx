import Link from 'next/link';
import { requirePage } from '@/lib/auth';
import { getFinderTasks, getMemberNotices, getMyClaims, getMyItems } from '@/lib/data';
import { getT } from '@/lib/i18n-server';
import { getCommunityStats } from '@/lib/stats';
import type { Item } from '@/lib/types';
import { CategoryArt, Icon } from '@/components/Icon';
import { Empty, Illustration } from '@/components/Illustration';
import { placeDate, Stat, Stepper, when } from '@/components/ui';

const hasMatch = (i: Item) => i.status === 3 && i.kind === 'lost' && !!i.matchedItemId;

export default async function HomePage() {
  const { user } = await requirePage({ membership: true });
  const orgId = user.organizationId!;
  const [t, mine, claims, community, notices, finderTasks] = await Promise.all([
    getT(), getMyItems(user.id, orgId), getMyClaims(user.id), getCommunityStats(orgId, user.id), getMemberNotices(user.id, orgId),
    getFinderTasks(user.id, orgId),
  ]);
  const open = mine.filter(i => i.status < 5);

  // "Action needed": things only this member can move forward.
  const actions: { icon: string; tone: string; title: string; item: string; help: string; label: string; href: string }[] = [];
  for (const c of claims.filter(c => c.status === 'approved'))
    actions.push({ icon: 'ticket', tone: 'green', title: 'Claim approved', item: c.itemTitle, help: 'Bring your photo ID and pickup code to the office.', label: 'Open pickup pass', href: '/my-items?tab=claims' });
  for (const f of finderTasks.filter(f => !f.handed_in_at))
    actions.push({ icon: 'hand', tone: 'amber', title: 'Someone has claimed the item you reported', item: f.title, help: 'Please take it to the office. Staff check the owner’s ID there and return it.', label: 'Hand over to the office', href: '/my-items?tab=found' });
  for (const i of mine.filter(hasMatch))
    actions.push({ icon: 'search', tone: '', title: 'Possible match found', item: i.title, help: 'Check if this is your item.', label: 'Review match', href: '/my-items' });

  return (
    <>
      <div className="hero" style={{ display: 'flex', alignItems: 'center', gap: 20, justifyContent: 'space-between', flexWrap: 'wrap' }}>
        <div>
          <h1>{t('Hello, {name}', { name: user.name.split(' ')[0] })}</h1>
          <p>{open.length === 1 ? t('1 item in progress.') : t('{n} items in progress.', { n: open.length })}</p>
        </div>
        <div style={{ background: 'rgba(255,255,255,.12)', borderRadius: 16, padding: 6 }}><Illustration name="done" size={110} /></div>
      </div>

      <div className="quick">
        <Link href="/report"><span className="icon-chip red"><Icon name="search" /></span><span><b>{t('I lost something')}</b><span className="meta">{t('Report it and get matches')}</span></span></Link>
        <Link href="/report?kind=found"><span className="icon-chip green"><Icon name="hand" /></span><span><b>{t('I found something')}</b><span className="meta">{t('Post it so the owner can claim it')}</span></span></Link>
        <Link href="/browse"><span className="icon-chip"><Icon name="grid" /></span><span><b>{t('Browse found items')}</b><span className="meta">{t('Look for your item')}</span></span></Link>
      </div>

      {actions.length > 0 && (
        <>
          <h2>{t('Action needed')}</h2>
          {actions.map((a, i) => (
            <div key={i} className="box" style={{ display: 'flex', gap: 14, alignItems: 'center', marginBottom: 10, flexWrap: 'wrap' }}>
              <span className={'icon-chip ' + a.tone}><Icon name={a.icon} /></span>
              <div style={{ flex: 1, minWidth: 200 }}><b>{t(a.title)}</b><div className="meta">{a.item} · {t(a.help)}</div></div>
              <Link className="btn" href={a.href}>{t(a.label)}</Link>
            </div>
          ))}
        </>
      )}

      <h2>{t('Your items')}</h2>
      {open.length ? (
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))' }}>
          {open.slice(0, 4).map(i => (
            <Link key={i.id} href={`/my-items${i.kind === 'found' ? '?tab=found' : ''}`} className="box" style={{ color: 'inherit', textDecoration: 'none' }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <CategoryArt category={i.category} />
                <div style={{ flex: 1, minWidth: 0 }}><b style={{ color: 'var(--ink)' }}>{i.title}</b><div className="meta">{t(i.kind === 'lost' ? 'Lost' : 'Found')} · {placeDate(i.place, i.date, t)}</div></div>
              </div>
              <Stepper n={i.status} t={t} />
            </Link>
          ))}
        </div>
      ) : <Empty art="empty" title={t('Nothing in progress.')} text={t('Lost or found something? Report it in a few taps.')} />}
      {open.length > 4 && <div className="btnrow"><Link className="btn sec" href="/my-items">{t('See all my items')}</Link></div>}

      <div className="cols even" style={{ marginTop: 8 }}>
        <div>
          <h2>{t('Recent activity')}</h2>
          {notices.length ? (
            <div className="box" style={{ padding: '6px 18px' }}>
              {notices.slice(0, 4).map(n => (
                <Link key={n.id} href={n.href} className="kv" style={{ textDecoration: 'none', color: 'inherit', padding: '10px 0', borderBottom: '1px solid var(--line2)', margin: 0 }}>
                  <span><b style={{ fontWeight: 500 }}>{t(n.title)}</b><span className="meta" style={{ display: 'block' }}>{n.text}</span></span>
                  <span className="meta" style={{ whiteSpace: 'nowrap' }}>{when(n.at)}</span>
                </Link>
              ))}
              <div style={{ padding: '10px 0' }}><Link href="/notifications">{t('See all notifications')}</Link></div>
            </div>
          ) : <div className="box meta">{t('No activity yet.')}</div>}
        </div>
        <div>
          <h2>{t('Community')}</h2>
          <div className="grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <Stat n={community.month} label={t('Returned this month')} />
            <Stat n={community.rate + '%'} label={t('Community return rate')} />
            <Stat n={community.helped} label={t('Items you helped return')} />
            <Stat n={claims.filter(c => c.status === 'returned').length} label={t('Items you got back')} />
          </div>
        </div>
      </div>
    </>
  );
}

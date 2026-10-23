import Link from 'next/link';
import { requirePage } from '@/lib/auth';
import { getClaimsOnMyFinds, getNotices, getFinderTasks, getMyClaims, getMyItems, getUnthankedReturns } from '@/lib/data';
import { finderJourney, keepUntil, ownerJourney } from '@/lib/journey';
import { getOrgSettings } from '@/lib/settings';
import { getPoints, getRanking } from '@/lib/points';
import { PointsCard, Ranking } from '@/components/Points';
import { GUIDE_URL } from '@/lib/constants';
import { JourneyBar } from '@/components/Journey';
import { getT } from '@/lib/i18n-server';
import { getCommunityStats, getItemCounts } from '@/lib/stats';
import { getMatchPairs } from '@/lib/data';
import { StatCards, SuggestedMatches } from '@/components/Dashboard';
import type { Item } from '@/lib/types';
import { CategoryArt, Icon } from '@/components/Icon';
import { Empty, Illustration } from '@/components/Illustration';
import { placeDate, Stat, when } from '@/components/ui';

const hasMatch = (i: Item) => i.status === 3 && i.kind === 'lost' && !!i.matchedItemId;

export default async function HomePage() {
  const { user } = await requirePage({ membership: true });
  const orgId = user.organizationId!;
  const [t, mine, claims, community, notices, finderTasks, unthanked, { keepDays }, points, ranking] = await Promise.all([
    getT(), getMyItems(user.id, orgId), getMyClaims(user.id), getCommunityStats(orgId, user.id), getNotices(user.id, user.role, orgId),
    getFinderTasks(user.id, orgId), getUnthankedReturns(user.id), getOrgSettings(orgId), getPoints(user.id, orgId), getRanking(orgId, 3),
  ]);
  const [onFinds, counts, pairs] = await Promise.all([getClaimsOnMyFinds(user.id, orgId), getItemCounts(orgId), getMatchPairs(orgId, user.id)]);
  const openPairs = pairs.filter(p => p.lostStatus < 4 && p.claimStatus !== 'pending' && p.claimStatus !== 'approved');
  const journeyOf = (i: Item) => {
    if (i.kind === 'found') return finderJourney({ claim: onFinds.get(i.id) ?? null, handedIn: !!i.handedInAt, atOffice: !!i.receivedAt, returned: i.status === 5, thanked: false,
      due: !i.receivedAt && !i.handedInAt && i.status < 5 ? keepUntil(i.createdAt, keepDays) : null });
    const oc = i.matchedItemId ? claims.find(c => c.foundItemId === i.matchedItemId) ?? null : null;
    return ownerJourney({ matched: !!i.matchedItemId, claim: oc?.status ?? null, claimId: oc?.id, atOffice: !!oc?.shelf,
      thanked: !!oc && oc.status === 'returned' && !unthanked.some(u => u.claim_id === oc.id) });
  };
  const open = mine.filter(i => i.status < 5);

  // "Action needed": things only this member can move forward.
  const actions: { icon: string; tone: string; title: string; item: string; help: string; label: string; href: string }[] = [];
  for (const c of claims.filter(c => c.status === 'approved'))
    actions.push({ icon: 'ticket', tone: 'green', title: 'Claim approved', item: c.itemTitle, help: 'Bring your photo ID and pickup code to the office.', label: 'Open pickup pass', href: '/my-items?tab=claims' });
  for (const f of finderTasks.filter(f => !f.handed_in_at))
    actions.push({ icon: 'hand', tone: 'amber', title: 'Someone has claimed the item you reported', item: f.title, help: 'Please take it to the office. Staff check the owner’s ID there and return it.', label: 'Hand over to the office', href: '/my-items?tab=found' });
  for (const u of unthanked)
    actions.push({ icon: 'hand', tone: 'green', title: 'You got your item back', item: u.title, help: 'Send a thank-you letter to the person who found it.', label: 'Write a thank-you letter', href: `/thanks/${u.claim_id}` });
  for (const i of mine.filter(hasMatch))
    actions.push({ icon: 'search', tone: '', title: 'Possible match found', item: i.title, help: 'Check if this is your item.', label: 'Review match', href: '/my-items' });

  return (
    <>
      <div className="hero dash-hero">
        <span className="deco" style={{ left: '46%', top: 18 }} aria-hidden="true">✦</span>
        <span className="deco d2" style={{ left: '58%', bottom: 22 }} aria-hidden="true">♥</span>
        <span className="deco d3" style={{ right: 230, top: 30 }} aria-hidden="true">★</span>
        <div className="dash-hero-text">
          <span className="hero-kicker">{t('Dashboard')}</span>
          <h1>{t('Welcome back, {name}!', { name: user.name.split(' ')[0] })}</h1>
          <p>{t('Lost something, or found something? Report it here. We match found items with lost reports, and the office makes sure every item gets back to its owner safely.')}</p>
          <div className="btnrow" style={{ marginTop: 0 }}>
            <Link className="btn" href="/report"><Icon name="search" size={16} />{t('Report lost item')}</Link>
            <Link className="btn sec" href="/report?kind=found"><Icon name="hand" size={16} />{t('Report found item')}</Link>
          </div>
          {open.length > 0 && <p className="meta" style={{ margin: '12px 0 0' }}>{open.length === 1 ? t('1 item in progress.') : t('{n} items in progress.', { n: open.length })}</p>}
        </div>
        <Illustration name="finder" size={190} className="hero-art" />
      </div>
      <StatCards c={counts} t={t} />

      {mine.length === 0 && claims.length === 0 && (
        <a href={GUIDE_URL} className="guidecard" style={{ marginBottom: 20 }}>
          <Illustration name="report" size={90} />
          <span><b>{t('New here? See how it works')}</b><span className="meta">{t('A 2-minute interactive guide: how a lost item gets back to its owner.')}</span></span>
          <span className="btn">{t('Start')} →</span>
        </a>
      )}
      {openPairs.length > 0 && (
        <>
          <h2>✨ {t('Suggested matches for you')}</h2>
          <SuggestedMatches pairs={openPairs.slice(0, 3)} t={t} reviewHref="/my-items" />
        </>
      )}

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
              {(() => { const j = journeyOf(i); return (<>
                <JourneyBar done={j.done} t={t} compact />
                <div className={'nextline ' + j.next.who}>{t(j.next.text)}</div>
              </>); })()}
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
          <h2>{t('Your points')}</h2>
          <PointsCard p={points} t={t} compact />
          <h2>{t('Top helpers')}</h2>
          <Ranking rows={ranking} meId={user.id} t={t} />
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

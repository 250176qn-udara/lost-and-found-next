import Link from 'next/link';
import type { ReactNode } from 'react';
import { requirePage } from '@/lib/auth';
import { getOrgSettings } from '@/lib/settings';
import { getPoints, getRanking } from '@/lib/points';
import { getBadges, getSightings } from '@/lib/community';
import { PointRules, PointsCard, Ranking } from '@/components/Points';
import { POINT_REASONS } from '@/lib/constants';
import { statusName } from '@/lib/constants';
import { getClaimMessages, getClaimsOnMyFinds, getMatchPairs, getMyClaims, getMyItems, getThanks, getUnthankedReturns } from '@/lib/data';
import { ClaimChat } from '@/components/ClaimChat';
import { GIFT_BRANDS } from '@/lib/gifts';
import { ThankYouCard } from '@/components/ThankYouCard';
import { GiftReveal } from './GiftReveal';
import { ReactionBar } from './ReactionBar';
import { getT } from '@/lib/i18n-server';
import { scoreClass, scoreMatch } from '@/lib/match';
import type { Claim, ClaimStatus, Item } from '@/lib/types';
import type { T } from '@/lib/i18n';
import { ClaimButton } from '@/components/ClaimButton';
import { Expandable } from '@/components/Expandable';
import { HandToOfficeButton } from '@/components/HandToOfficeButton';
import { KeepLimit } from '@/components/Journey';
import { CategoryArt, Icon } from '@/components/Icon';
import { Empty } from '@/components/Illustration';
import { RejectMatchButton } from '@/components/MatchButtons';
import { PickupPass } from '@/components/PickupPass';
import { pickTab, Tabs, type TabDef } from '@/components/Tabs';
import { Head, Kv, placeDate, when } from '@/components/ui';
import { JourneyPanel } from '@/components/Journey';
import { keepUntil, finderJourney, ownerJourney, type NextStep } from '@/lib/journey';

const CLAIM_LABEL: Record<ClaimStatus, string> = { pending: 'Checking your answers', approved: 'Ready to pick up', returned: 'Returned', rejected: 'Not approved' };
const CLAIM_BADGE: Record<ClaimStatus, string> = { pending: '', approved: 'ok', returned: 'ok', rejected: 'no' };

/** Everything the member reported or claimed. Each card opens to show progress, matches, pickup pass and hand-over. */
export default async function MyItemsPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { user } = await requirePage({ roles: ['member'], membership: true });
  const orgId = user.organizationId!;
  const [{ tab }, t, mine, claims, pairs, onFinds, thanks, unthanked, { keepDays }, points, ranking, badges] = await Promise.all([
    searchParams, getT(), getMyItems(user.id, orgId), getMyClaims(user.id), getMatchPairs(orgId, user.id), getClaimsOnMyFinds(user.id, orgId),
    getThanks(user.id), getUnthankedReturns(user.id), getOrgSettings(orgId), getPoints(user.id, orgId), getRanking(orgId, 10), getBadges(user.id, orgId),
  ]);
  const [msgs, seen] = await Promise.all([getClaimMessages(claims.map(c => c.id)), getSightings(mine.filter(i => i.kind === 'lost').map(i => i.id))]);
  const question = (id: number) => (msgs[id] ?? []).some(m => m.fromStaff && !m.readAt);
  // Journey helpers: the owner's latest claim on a found item, and whether thanks were sent / received.
  const claimOn = (foundId?: number | null) => (foundId ? claims.find(c => c.foundItemId === foundId) ?? null : null);
  const thankedClaim = (claimId: number) => !unthanked.some(u => u.claim_id === claimId);
  const lost = mine.filter(i => i.kind === 'lost');
  const found = mine.filter(i => i.kind === 'found');
  const activeClaims = claims.filter(c => c.status !== 'rejected');
  const tabs: TabDef[] = [
    { key: 'lost', label: 'Things I lost', icon: 'search', count: lost.filter(i => i.status < 5).length },
    { key: 'found', label: 'Things I found', icon: 'hand', count: found.filter(i => i.status < 5).length },
    { key: 'claims', label: 'My claims', icon: 'ticket', count: claims.filter(c => c.status === 'approved' || c.status === 'pending').length },
    { key: 'thanks', label: 'Thanks', icon: 'hand', count: thanks.received.filter(x => !x.readAt).length + unthanked.length },
    { key: 'points', label: 'Points', icon: 'check' },
  ];
  const cur = pickTab(tabs, tab === 'matches' ? 'lost' : tab);

  return (
    <>
      <Head title={t('My items')} sub={t('Everything you reported or claimed. Click a card to see the details.')} />
      <Tabs tabs={tabs} current={cur} base="/my-items" t={t} />

      {cur === 'lost' && (lost.length ? lost.map((i, n) => {
        const pair = pairs.find(p => p.lostId === i.id);
        const oc = claimOn(pair?.foundId ?? i.matchedItemId);
        const j = ownerJourney({ matched: !!pair || !!i.matchedItemId, claim: oc?.status ?? null, claimId: oc?.id, atOffice: !!oc?.shelf,
          thanked: !!oc && oc.status === 'returned' && thankedClaim(oc.id) });
        return (
          <Expandable key={i.id} open={(n === 0 && !!pair) || j.next.who === 'you'} tone={i.status === 5 ? 'done' : ''} head={<ItemHead i={i} t={t} next={j.next} extra={pair && i.status === 3 ? <span className="badge">{t('Possible match found')}</span> : null} />}>
            <JourneyPanel j={j} t={t} />
            {i.description && <><div className="sec-title" style={{ marginTop: 16 }}>{t('Your description')}</div><p style={{ margin: 0, whiteSpace: 'pre-line' }}>{i.description}</p></>}
            {(seen[i.id]?.length ?? 0) > 0 && i.status < 5 && (
              <>
                <div className="sec-title" style={{ marginTop: 16 }}>👀 {t('People who may have seen it')}</div>
                {seen[i.id].map(g => <div className="sighting" key={g.id}><span>“{g.note}”</span><span className="meta">{when(g.at)}</span></div>)}
              </>
            )}
            {pair && i.status < 5 && (() => {
              const { score, why } = scoreMatch({ place: pair.lostPlace, date: pair.lostDate, lat: pair.lostLat, lng: pair.lostLng, category: pair.lostCategory }, { place: pair.foundPlace, date: pair.foundDate, lat: pair.foundLat, lng: pair.foundLng, category: pair.foundCategory }, pair.aiScore);
              const claimed = pair.claimStatus === 'pending' || pair.claimStatus === 'approved';
              return (
                <>
                  <div className="sec-title" style={{ marginTop: 16 }}>{t('Possible match')}</div>
                  <div className="box" style={{ display: 'flex', gap: 16, alignItems: 'center', boxShadow: 'none', flexWrap: 'wrap' }}>
                    <CategoryArt category={i.category} />
                    <div style={{ flex: 1, minWidth: 180 }}>
                      <b>{pair.foundTitle}</b><div className="meta">{placeDate(pair.foundPlace, pair.foundDate, t)}</div>
                      <div className="pillrow">{why.map(w => <span className="pill" key={w}>{t(w)}</span>)}</div>
                    </div>
                    <div style={{ textAlign: 'center' }}><div className={'score ' + scoreClass(score)}>{score}%</div><div className="meta">{t('Match score')}</div></div>
                  </div>
                  <div className="btnrow">
                    {claimed
                      ? <Link className="btn sec" href="/my-items?tab=claims">{t('See my claim')}</Link>
                      : <><ClaimButton itemId={pair.foundId} label="This is mine" /><RejectMatchButton lostId={i.id} label="Not mine" /></>}
                  </div>
                </>
              );
            })()}
            <div className="btnrow"><Link className="btn sec" href={`/items/${i.id}`}>{t('Full details')}</Link></div>
          </Expandable>
        );
      }) : <Empty art="search" title={t('You have not reported anything lost.')} text={t('Report it and we will look for it among the found items.')}><Link className="btn" href="/report">{t('I lost something')}</Link></Empty>)}

      {cur === 'found' && (found.length ? found.map(i => {
        const claim = onFinds.get(i.id);
        const withFinder = !i.receivedAt && i.status < 5;
        const due = withFinder && !i.handedInAt ? keepUntil(i.createdAt, keepDays) : null;
        const j = finderJourney({ claim: claim ?? null, handedIn: !!i.handedInAt, atOffice: !!i.receivedAt, returned: i.status === 5,
          thanked: thanks.received.some(x => x.itemId === i.id), due });
        return (
          <Expandable key={i.id} open={j.next.who === 'you'} tone={i.status >= 5 ? 'done' : ''}
            head={<ItemHead i={i} t={t} next={j.next} extra={claim && claim !== 'returned' ? <span className="badge">{t('Someone claimed it')}</span>
              : due?.overdue ? <span className="badge no">{t('Time limit passed')}</span> : null} />}>
            <JourneyPanel j={j} t={t}>{withFinder && !i.handedInAt ? <HandToOfficeButton itemId={i.id} itemCode={i.itemCode ?? null} /> : undefined}</JourneyPanel>
            {due && <KeepLimit due={due} keepDays={keepDays} t={t} />}
            <div className="cols even" style={{ marginTop: 16 }}>
              <div>
                <div className="sec-title">{t('Where it is')}</div>
                {i.status === 5 ? <p style={{ margin: 0 }}>{t('Returned to its owner. Thank you!')}</p>
                  : i.receivedAt ? <p style={{ margin: 0 }}>{t('At the office (shelf {shelf}).', { shelf: i.shelf ?? '—' })}</p>
                  : i.handedInAt ? <p style={{ margin: 0 }}>{t('You handed it to the office. Staff will confirm it.')}</p>
                  : <p style={{ margin: 0 }}>{t('You are keeping it.')}</p>}
                <Kv label={t('Item code')} value={i.itemCode} />
              </div>
              <div>
                <div className="sec-title">{t('Claims')}</div>
                <p style={{ margin: 0 }}>{t(!claim ? 'Nobody has claimed it yet.' : claim === 'pending' ? 'Someone has claimed it. Staff are checking it.' : claim === 'approved' ? 'The owner was confirmed.' : 'The owner got it back.')}</p>
              </div>
            </div>
            <div className="btnrow"><Link className="btn sec" href={`/items/${i.id}`}>{t('Full details')}</Link></div>
          </Expandable>
        );
      }) : <Empty art="report" title={t('You have not posted any found items.')} text={t('Found something? Post it so the owner can find it.')}><Link className="btn" href="/report?kind=found">{t('I found something')}</Link></Empty>)}

      {cur === 'claims' && (activeClaims.length || claims.length ? claims.map((c, n) => {
        const j = ownerJourney({ matched: true, claim: c.status, claimId: c.id, atOffice: !!c.shelf, thanked: c.status === 'returned' && thankedClaim(c.id) });
        return (
        <Expandable key={c.id} open={(n === 0 && c.status === 'approved') || question(c.id) || j.next.who === 'you'} tone={c.status === 'returned' ? 'done' : c.status === 'rejected' ? 'muted' : ''}
          head={<><ClaimHead c={c} t={t} next={j.next} />{question(c.id) && <span className="badge no">{t('Question from the office')}</span>}</>}>
          <JourneyPanel t={t} j={j} />
          {c.status === 'approved' && <PickupPass t={t} title={c.itemTitle} itemCode={c.itemCode} pickupCode={c.pickupCode} shelf={c.shelf} approvedAt={c.decidedAt} atOffice={!!c.shelf} />}
          {c.status === 'pending' && (
            <>
              <p style={{ marginTop: 0 }}>{t('Staff are comparing your answers with the details only the owner would know. You will get a notification.')}</p>
              <div className="sec-title">{t('Your answers')}</div><p style={{ margin: 0, whiteSpace: 'pre-line' }}>{c.answers}</p>
            </>
          )}
          {c.status === 'returned' && (
            <div className="btnrow" style={{ marginTop: 0 }}>
              {thanks.sent.some(x => x.claimId === c.id) && <span className="badge ok">{t('Thanks sent')}</span>}
              <Link className="btn sec" href={`/history/${c.id}`}><Icon name="check" size={16} />{t('Certificate of return')}</Link>
            </div>
          )}
          {(c.status === 'pending' || c.status === 'approved' || (msgs[c.id] ?? []).length > 0) && (
            <ClaimChat claimId={c.id} messages={msgs[c.id] ?? []} viewer="claimant" open={c.status === 'pending' || c.status === 'approved'} messagesHref="/messages" />
          )}
          {c.status === 'rejected' && <p style={{ margin: 0 }}>{t('Staff could not confirm that this item is yours. If you think this is a mistake, ask at the office.')}</p>}
        </Expandable>
        );
      }) : <Empty art="verify" title={t('You have no claims yet.')} text={t('When you find your item in Found items, press "This is mine".')}><Link className="btn" href="/browse">{t('Browse found items')}</Link></Empty>)}

      {cur === 'thanks' && (
        <>
          {unthanked.length > 0 && (
            <>
              <h2 style={{ marginTop: 0 }}>{t('Say thank you')}</h2>
              {unthanked.map(u => (
                <div key={u.claim_id} className="box" style={{ display: 'flex', gap: 14, alignItems: 'center', marginBottom: 10, flexWrap: 'wrap' }}>
                  <span className="icon-chip green"><Icon name="hand" /></span>
                  <div style={{ flex: 1, minWidth: 200 }}><b>{u.title}</b><div className="meta">{t('You got it back. A short letter means a lot to the finder.')}</div></div>
                  <Link className="btn" href={`/thanks/${u.claim_id}`}>{t('Write a thank-you letter')}</Link>
                </div>
              ))}
            </>
          )}
          <h2 style={unthanked.length ? undefined : { marginTop: 0 }}>{t('Letters you received')}</h2>
          {thanks.received.length ? (
            <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))' }}>
              {thanks.received.map(x => (
                <ThankYouCard key={x.id} design={x.card} message={x.message} from={x.fromName ?? t('The owner of {item}', { item: x.itemTitle })}>
                  {!x.readAt && <span className="badge" style={{ position: 'absolute', top: 12, right: 12 }}>{t('New')}</span>}
                  {x.points > 0 && <div className="letter-points">⭐ +{x.points} {t('thank-you points')}</div>}
                  {x.giftAmount && <div className="letter-gift">🎁 {t(GIFT_BRANDS.find(b => b.key === x.giftBrand)?.name ?? 'E-gift')} ¥{x.giftAmount.toLocaleString()}</div>}
                  <GiftReveal thanksId={x.id} unread={!x.readAt} code={x.giftCode} how={GIFT_BRANDS.find(b => b.key === x.giftBrand)?.how ?? ''} />
                  <ReactionBar thanksId={x.id} current={x.reaction} />
                </ThankYouCard>
              ))}
            </div>
          ) : <Empty art="done" title={t('No letters yet.')} text={t('When an owner gets back an item you found, they can send you a thank-you letter here.')} />}
          {thanks.sent.length > 0 && (
            <>
              <h2>{t('Letters you sent')}</h2>
              <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))' }}>
                {thanks.sent.map(x => (
                  <ThankYouCard key={x.id} design={x.card} message={x.message} from={t('you')}>
                    {x.points > 0 && <div className="letter-points">⭐ +{x.points} {t('thank-you points')}</div>}
                    {x.giftAmount && <div className="letter-gift">🎁 {t(GIFT_BRANDS.find(b => b.key === x.giftBrand)?.name ?? 'E-gift')} ¥{x.giftAmount.toLocaleString()}</div>}
                    <div className="meta" style={{ marginTop: 6 }}>{x.itemTitle} · {x.createdAt.slice(0, 10)}</div>
                    {x.reaction && <div className="reacted"><span>{x.reaction}</span>{t('The finder reacted')}</div>}
                  </ThankYouCard>
                ))}
              </div>
            </>
          )}
        </>
      )}
      {cur === 'points' && (
        <>
          <div className="cols even">
            <div>
              <PointsCard p={points} t={t} />
              <h2>{t('Points history')}</h2>
              {points.history.length ? (
                <div className="box" style={{ padding: '6px 18px' }}>
                  {points.history.map((h, i) => (
                    <div className="kv" key={i} style={{ padding: '8px 0', margin: 0, borderBottom: '1px solid var(--line2)' }}>
                      <span>{t(POINT_REASONS[h.reason] ?? h.reason)}<span className="meta" style={{ display: 'block' }}>{h.item ?? ''} · {h.at.slice(0, 10)}</span></span>
                      <b className="pts-plus">+{h.points}</b>
                    </div>
                  ))}
                </div>
              ) : <div className="box meta">{t('No points yet. Post what you find and bring it to the office to earn points.')}</div>}
            </div>
            <div>
              <h2 style={{ marginTop: 0 }}>{t('Top helpers')}</h2>
              <Ranking rows={ranking} meId={user.id} t={t} />
              <p className="meta">{t('You can hide your name from this list under Account → Privacy.')}</p>
            </div>
          </div>
          <h2>{t('Badges')} <span className="meta">({badges.filter(b => b.earned).length}/{badges.length})</span></h2>
          <div className="badges">
            {badges.map((b, i) => (
              <div key={b.key} className={'badge-tile' + (b.earned ? ' on' : '')} style={{ animationDelay: `${i * 0.05}s` }} title={t(b.desc)}>
                <span className="bt-icon" aria-hidden="true">{b.earned ? b.icon : '🔒'}</span>
                <b>{t(b.name)}</b>
                <span className="meta">{t(b.desc)}</span>
              </div>
            ))}
          </div>
          <PointRules t={t} />
        </>
      )}
    </>
  );
}

function ItemHead({ i, t, extra, next }: { i: Item; t: T; extra?: ReactNode; next?: NextStep }) {
  return (
    <>
      <CategoryArt category={i.category} />
      <div className="grow"><b>{i.title}</b><div className="meta">{placeDate(i.place, i.date, t)}</div>{next && <NextLine next={next} t={t} />}</div>
      {extra}
      <span className={'badge ' + (i.status === 5 ? 'ok' : '')}>{t(statusName(i.status))}</span>
    </>
  );
}

/** One line under a card title: whose turn it is and what happens next. */
function NextLine({ next, t }: { next: NextStep; t: T }) {
  return <div className={'nextline ' + next.who}>{next.who === 'you' ? '👉 ' : ''}{t(next.text)}</div>;
}

function ClaimHead({ c, t, next }: { c: Claim; t: T; next?: NextStep }) {
  return (
    <>
      <span className={'icon-chip ' + (c.status === 'approved' ? 'green' : c.status === 'rejected' ? 'red' : c.status === 'returned' ? 'green' : 'amber')}>
        <Icon name={c.status === 'approved' ? 'ticket' : c.status === 'returned' ? 'check' : c.status === 'rejected' ? 'alert' : 'clock'} />
      </span>
      <div className="grow"><b>{c.itemTitle}</b><div className="meta">{placeDate(c.itemPlace, c.itemDate, t)}</div>{next && <NextLine next={next} t={t} />}</div>
      <span className={'badge ' + CLAIM_BADGE[c.status]}>{t(CLAIM_LABEL[c.status])}</span>
    </>
  );
}

import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requirePage } from '@/lib/auth';
import { getOrgSettings } from '@/lib/settings';
import { getClaimEvents, getItemDetail, getPlaces, getThanks } from '@/lib/data';
import { keepUntil, finderJourney, ownerJourney, staffJourney, type Journey } from '@/lib/journey';
import { JourneyBar, JourneyPanel, KeepLimit } from '@/components/Journey';
import { getT } from '@/lib/i18n-server';
import { itemEvents } from '@/lib/timeline';
import { ClaimButton } from '@/components/ClaimButton';
import { CloseItemButton } from '@/components/CloseItemButton';
import { HandToOfficeButton } from '@/components/HandToOfficeButton';
import { CategoryArt, Icon } from '@/components/Icon';
import { RejectMatchButton } from '@/components/MatchButtons';
import { QrCode } from '@/components/QrCode';
import { MapView } from '@/components/MapView';
import { FloorPlan } from '@/components/FloorPlan';
import { mapsLink } from '@/lib/geo';
import { Callout, Head, KindBadge, Kv, placeDate, Timeline } from '@/components/ui';

export default async function ItemPage({ params }: { params: Promise<{ id: string }> }) {
  const { user } = await requirePage({ membership: true });
  const { id } = await params;
  const it = await getItemDetail(Number(id) || 0, user.organizationId!);
  const isStaff = user.role === 'staff' || user.role === 'admin';
  const isMine = !!it && it.reporterId === user.id;
  // Members see their own reports, and found items held at the office (without who handed them in).
  const visible = it && (isStaff || isMine || (it.kind === 'found' && it.status >= 2 && it.status < 5));
  if (!visible) notFound();

  const [t, claims, { policeDays, keepDays }, places] = await Promise.all([getT(), getClaimEvents(it.id), getOrgSettings(user.organizationId!), getPlaces(user.organizationId!)]);
  // Members see claims only on their own reports: their own claims (lost report), or that someone claimed the item
  // they found (found item). Names and answers stay hidden from members (showNames below is staff only).
  const shownClaims = isStaff || isMine ? claims : [];
  const isFinder = isMine && it.kind === 'found';
  // A finder who still has it: the time limit for bringing it to the office.
  const keep = isFinder && !it.receivedAt && !it.handedInAt && it.status < 5 ? keepUntil(it.createdAt, keepDays) : null;
  const openClaim = claims.find(c => c.status === 'approved') ?? claims.find(c => c.status === 'pending');
  const withFinder = it.kind === 'found' && !it.receivedAt && it.status < 5;
  // The viewer's own latest claim on this item (members only see their own).
  const myClaim = [...claims].reverse().find(c => c.claimantId === user.id) ?? null;
  const myOpenClaim = myClaim && (myClaim.status === 'pending' || myClaim.status === 'approved') ? myClaim : null;
  const canClaim = user.role === 'member' && !isMine && !myOpenClaim && it.kind === 'found' && it.status >= 2 && it.status < 5;
  // Like real lost-and-found desks: a found item's description is private (only staff and the finder), so a claimant
  // has to describe the item themselves and cannot copy the answers.
  const showDetails = it.kind === 'lost' || isStaff || isMine;
  const atOffice = it.kind === 'found' && !!it.receivedAt && it.status < 5;
  const policeDue = atOffice ? new Date(Date.parse(it.receivedAt!.replace(' ', 'T')) + policeDays * 86_400_000).toISOString().slice(0, 10) : null;
  const lostId = it.kind === 'lost' ? it.id : it.matchedItemId;

  // The journey from the viewer's point of view (owner, finder or staff).
  const latest = claims.find(c => c.status === 'returned') ?? openClaim ?? null;
  let journey: Journey | null = null;
  if (isStaff && it.kind === 'found') {
    const th = latest?.status === 'returned' ? await getThanks(latest.claimantId) : null;
    journey = staffJourney({ itemId: it.id, claim: latest?.status ?? null, handedIn: !!it.handedInAt, atOffice: !!it.receivedAt,
      returned: it.status === 5, closed: it.status === 6, thanked: !!th?.sent.some(x => x.claimId === latest!.id) });
  } else if (isFinder) {
    const th = await getThanks(user.id);
    journey = finderJourney({ claim: latest?.status ?? null, handedIn: !!it.handedInAt, atOffice: !!it.receivedAt, returned: it.status === 5,
      thanked: th.received.some(x => x.itemId === it.id), due: keep });
  } else if (isMine && it.kind === 'lost') {
    const own = [...claims].reverse().find(c => c.claimantId === user.id) ?? null;
    const [found, th] = await Promise.all([it.matchedItemId ? getItemDetail(it.matchedItemId, user.organizationId!) : null, getThanks(user.id)]);
    journey = ownerJourney({ matched: !!it.matchedItemId, claim: own?.status ?? null, claimId: own?.id, atOffice: !!found?.receivedAt,
      thanked: !!own && th.sent.some(x => x.claimId === own.id) });
  }

  return (
    <>
      <Head title={it.title} sub={t('Item details')} />
      <div className="cols">
        <div>
          <div className="box" style={{ marginBottom: 16 }}>
            {it.hasPhoto
              ? <img className="photo" src={`/api/items/${it.id}/photo`} alt="" />
              : <CategoryArt category={it.category} big />}
            <Kv label={t('Type')} value={<KindBadge kind={it.kind} t={t} />} />
            <Kv label={t('Category')} value={t(it.category)} />
            <Kv label={t('Place')} value={t(it.place)} />
            <Kv label={t('Date')} value={it.date} />
            <Kv label={t('Shelf')} value={it.status < 5 ? it.shelf : null} />
            <Kv label={t('Item code')} value={it.itemCode} />
            {(isStaff || isMine) && <Kv label={t('Reported by')} value={it.reporterName} />}
            {isStaff && <Kv label={t('Finder name')} value={it.finderName} />}
            {it.description && showDetails && (it.kind === 'found' ? (
              <div className="hidden-note" style={{ marginTop: 12 }}>
                <div className="meta"><Icon name="shield" size={15} />{t('Private details — only staff and the finder see these')}</div>
                <div style={{ whiteSpace: 'pre-line' }}>{it.description}</div>
              </div>
            ) : <p className="meta" style={{ whiteSpace: 'pre-line' }}>{it.description}</p>)}
            {!showDetails && <p className="meta" style={{ display: 'flex', gap: 6, alignItems: 'center' }}><Icon name="shield" size={15} />{t('Private details are hidden. The owner describes them when claiming.')}</p>}
            {isStaff && it.itemCode && (
              <div style={{ marginTop: 10, display: 'flex', gap: 12, alignItems: 'center' }}>
                <QrCode text={it.itemCode} size={96} />
                <Link className="btn sec" href={`/label/${it.id}`}>{t('Print label')}</Link>
              </div>
            )}
          </div>
          <div className="box" style={{ marginBottom: 16 }}>
            <h2 style={{ marginTop: 0 }}>{t('Where')}</h2>
            <FloorPlan places={[...places.map(p => p.name), it.place]} selected={it.place} />
            {it.lat != null && it.lng != null && (
              <details className="mapfold">
                <summary>{t('Street map')}</summary>
                <MapView markers={[{ id: it.id, lat: it.lat, lng: it.lng, title: t(it.place) }]} height={220} />
                <a href={mapsLink({ lat: it.lat, lng: it.lng })} target="_blank" rel="noopener noreferrer"><Icon name="map" size={15} /> {t('Open in Google Maps')}</a>
              </details>
            )}
          </div>
          {it.status === 6 && (
            <Callout kind="red">
              <b>{t('Closed: {method}', { method: t(it.disposalMethod ?? '') })}</b>
              <div className="meta">{(it.disposedAt ?? '').slice(0, 16)}{it.disposalNote ? ` · ${it.disposalNote}` : ''}</div>
            </Callout>
          )}
          {isStaff && atOffice && (
            <div className="box" style={{ marginBottom: 16 }}>
              <h2 style={{ marginTop: 0 }}>{t('Office')}</h2>
              <Kv label={t('Report to police by')} value={policeDue} />
              <p className="meta">{t('If the owner is not found, report the item to the police within {n} days of receiving it.', { n: policeDays })}</p>
              <CloseItemButton itemId={it.id} />
            </div>
          )}
          {isFinder && withFinder && (
            <div className={'box note ' + (openClaim ? 'amber' : 'teal')}>
              {it.handedInAt ? (
                <>
                  <b>{t('You handed this item to the office')}</b>
                  <div className="meta">{t('Handed in {time}. Staff will confirm it and keep it until the owner collects it.', { time: it.handedInAt.slice(0, 16) })}</div>
                </>
              ) : (
                <>
                  <b>{t(openClaim ? (openClaim.status === 'approved' ? 'The owner was confirmed. Please hand the item to the office' : 'Someone has claimed the item you reported') : 'You are keeping this item')}</b>
                  <div className="meta" style={{ marginBottom: 12 }}>
                    {t(openClaim ? 'Please take it to the office. Staff check the owner’s ID there and return it.' : 'When you can, hand it to the office so the owner can collect it there.')}
                  </div>
                  {keep && <KeepLimit due={keep} keepDays={keepDays} t={t} />}
                  <HandToOfficeButton itemId={it.id} itemCode={it.itemCode} />
                </>
              )}
            </div>
          )}
          {myOpenClaim && (
            <div className="box note teal">
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <span className="icon-chip green"><Icon name="check" /></span>
                <div style={{ flex: 1 }}>
                  <b>{t('You claimed this')}</b>
                  <div className="meta">{t(myOpenClaim.status === 'approved' ? 'Approved — bring your photo ID and pickup code to the office.' : 'Staff are checking your answers. You will get a notification.')}</div>
                  <div className="meta">{t('Claim sent')}: {myOpenClaim.createdAt.slice(0, 16)}</div>
                </div>
              </div>
              <div className="btnrow"><Link className="btn sec" href="/my-items?tab=claims">{t(myOpenClaim.status === 'approved' ? 'Open pickup pass' : 'See my claim')}</Link></div>
            </div>
          )}
          {canClaim && (
            <div className="box">
              {myClaim?.status === 'rejected' && <p className="meta" style={{ marginTop: 0 }}>{t('Your earlier claim was not approved. You can claim again with more details.')}</p>}
              <h2 style={{ marginTop: 0 }}>{t('Claim this item')}</h2>
              <p className="meta">{t('Answer so staff can check that it is yours.')}</p>
              <ClaimButton itemId={it.id} label="This is mine" />
            </div>
          )}
        </div>
        <div>
          <div className="box" style={{ marginBottom: 16 }}>
            <h2 style={{ marginTop: 0 }}>{t('Progress')}</h2>
            {journey ? <JourneyPanel j={journey} t={t} /> : <JourneyBar done={[true, it.status >= 3, it.status >= 3, !!it.receivedAt || it.status === 5, it.status >= 4, it.status === 5, false]} t={t} />}
            <div style={{ marginTop: 16 }}><Timeline events={itemEvents(it, shownClaims, t, isStaff)} /></div>
          </div>
          {it.matchedItemId && (isStaff || isMine) && (
            <div className="box">
              <h2 style={{ marginTop: 0 }}>{t('Suggested match')}</h2>
              <b>{it.matchedTitle}</b>
              <div className="meta">{placeDate(it.matchedPlace ?? '', it.matchedDate ?? null, t)}</div>
              <div className="btnrow">
                <Link className="btn sec" href={isStaff ? `/items/${it.matchedItemId}` : '/my-items'}>{t(isStaff ? 'Open item' : 'Review match')}</Link>
                {isStaff && lostId && it.status < 4 && <RejectMatchButton lostId={lostId} label="Not a match" />}
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="btnrow">
        <Link className="btn sec" href={isStaff ? '/items' : isMine ? `/my-items${it.kind === 'found' ? '?tab=found' : ''}` : '/browse'}>{t('Back')}</Link>
      </div>
    </>
  );
}

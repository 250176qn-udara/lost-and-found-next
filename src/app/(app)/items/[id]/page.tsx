import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requirePage } from '@/lib/auth';
import { POLICE_DAYS } from '@/lib/constants';
import { getClaimEvents, getItemDetail } from '@/lib/data';
import { getT } from '@/lib/i18n-server';
import { itemEvents } from '@/lib/timeline';
import { ClaimButton } from '@/components/ClaimButton';
import { CloseItemButton } from '@/components/CloseItemButton';
import { HandToOfficeButton } from '@/components/HandToOfficeButton';
import { CategoryArt, Icon } from '@/components/Icon';
import { RejectMatchButton } from '@/components/MatchButtons';
import { QrCode } from '@/components/QrCode';
import { Callout, Head, KindBadge, Kv, placeDate, Stepper, Timeline } from '@/components/ui';

export default async function ItemPage({ params }: { params: Promise<{ id: string }> }) {
  const { user } = await requirePage({ membership: true });
  const { id } = await params;
  const it = await getItemDetail(Number(id) || 0, user.organizationId!);
  const isStaff = user.role === 'staff' || user.role === 'admin';
  const isMine = !!it && it.reporterId === user.id;
  // Members see their own reports, and found items held at the office (without who handed them in).
  const visible = it && (isStaff || isMine || (it.kind === 'found' && it.status >= 2 && it.status < 5));
  if (!visible) notFound();

  const [t, claims] = await Promise.all([getT(), getClaimEvents(it.id)]);
  // Members see claims only on their own reports: their own claims (lost report), or that someone claimed the item
  // they found (found item). Names and answers stay hidden from members (showNames below is staff only).
  const shownClaims = isStaff || isMine ? claims : [];
  const isFinder = isMine && it.kind === 'found';
  const openClaim = claims.find(c => c.status === 'approved') ?? claims.find(c => c.status === 'pending');
  const withFinder = it.kind === 'found' && !it.receivedAt && it.status < 5;
  const canClaim = user.role === 'member' && !isMine && it.kind === 'found' && it.status >= 2 && it.status < 5;
  // Like real lost-and-found desks: a found item's description is private (only staff and the finder), so a claimant
  // has to describe the item themselves and cannot copy the answers.
  const showDetails = it.kind === 'lost' || isStaff || isMine;
  const atOffice = it.kind === 'found' && !!it.receivedAt && it.status < 5;
  const policeDue = atOffice ? new Date(Date.parse(it.receivedAt!.replace(' ', 'T')) + POLICE_DAYS * 86_400_000).toISOString().slice(0, 10) : null;
  const lostId = it.kind === 'lost' ? it.id : it.matchedItemId;

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
            {isStaff && it.itemCode && <div style={{ marginTop: 10 }}><QrCode text={it.itemCode} size={96} /></div>}
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
              <p className="meta">{t('If the owner is not found, report the item to the police within {n} days of receiving it.', { n: POLICE_DAYS })}</p>
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
                  <HandToOfficeButton itemId={it.id} itemCode={it.itemCode} />
                </>
              )}
            </div>
          )}
          {canClaim && (
            <div className="box">
              <h2 style={{ marginTop: 0 }}>{t('Claim this item')}</h2>
              <p className="meta">{t('Answer so staff can check that it is yours.')}</p>
              <ClaimButton itemId={it.id} label="This is mine" />
            </div>
          )}
        </div>
        <div>
          <div className="box" style={{ marginBottom: 16 }}>
            <h2 style={{ marginTop: 0 }}>{t('Progress')}</h2>
            <Stepper n={Math.min(it.status, 5)} t={t} />
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

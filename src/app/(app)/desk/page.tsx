import Link from 'next/link';
import { requirePage } from '@/lib/auth';
import { getClaimsQueue, getQueue } from '@/lib/data';
import { getT } from '@/lib/i18n-server';
import { Expandable } from '@/components/Expandable';
import { Icon } from '@/components/Icon';
import { Empty } from '@/components/Illustration';
import { pickTab, Tabs, type TabDef } from '@/components/Tabs';
import { Callout, Head, Kv, placeDate, when } from '@/components/ui';
import { DecideButtons, HandoverForm } from './DeskActions';

const ago = (s: string) => Math.max(0, Math.floor((Date.now() - Date.parse(s.replace(' ', 'T'))) / 86_400_000));

/** Front desk: verify owners, hand items over, and take in items finders bring. */
export default async function DeskPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { user } = await requirePage({ roles: ['staff', 'admin'] });
  const orgId = user.organizationId!;
  const [{ tab }, t, claims, outside] = await Promise.all([searchParams, getT(), getClaimsQueue(orgId), getQueue(orgId)]);
  const pending = claims.filter(c => c.status === 'pending');
  const pickups = claims.filter(c => c.status === 'approved');
  const tabs: TabDef[] = [
    { key: 'verify', label: 'Verify claims', icon: 'shield', count: pending.length },
    { key: 'pickups', label: 'Pickups', icon: 'ticket', count: pickups.length },
    { key: 'finders', label: 'From finders', icon: 'hand', count: outside.filter(i => i.handedInAt).length },
  ];
  const cur = pickTab(tabs, tab);

  return (
    <>
      <Head title={t('Front desk')} sub={t('Check owners, hand items over, and take in items people bring.')} />
      <Tabs tabs={tabs} current={cur} base="/desk" t={t} />

      {cur === 'verify' && (pending.length ? pending.map((c, n) => (
        <Expandable key={c.id} open={n === 0} tone={ago(c.createdAt) >= 2 ? 'warn' : ''}
          head={<>
            <span className="icon-chip amber"><Icon name="shield" /></span>
            <div className="grow"><b>{c.itemTitle}</b><div className="meta">{t('claimed by {name}', { name: c.claimantName ?? '' })} · {when(c.createdAt)}</div></div>
            {ago(c.createdAt) >= 2 && <span className="badge no">{t('Waiting {n} days', { n: ago(c.createdAt) })}</span>}
          </>}>
          <div className="cols even">
            <div>
              <div className="sec-title">{t('What the claimant says')}</div>
              <div className="cmp" style={{ display: 'block', margin: 0 }}><div style={{ whiteSpace: 'pre-line' }}>{c.answers}</div></div>
              {c.lostDescription && <><div className="sec-title">{t('Their lost report')}</div><p style={{ margin: 0, whiteSpace: 'pre-line' }}>{c.lostDescription}</p></>}
              <Kv label={t('Email')} value={c.claimantEmail} />
            </div>
            <div>
              <div className="sec-title">{t('Private details of the found item')}</div>
              <div className="hidden-note">
                <div className="meta"><Icon name="shield" size={15} />{t('Only staff see this. Does the claimant describe it?')}</div>
                <div style={{ whiteSpace: 'pre-line' }}>{c.foundDescription || t('No private details were recorded. Ask the claimant in person.')}</div>
              </div>
              <Kv label={t('Found at')} value={placeDate(c.itemPlace, c.itemDate, t)} />
              <Kv label={t('Item code')} value={c.itemCode} />
            </div>
          </div>
          <DecideButtons id={c.id} />
          {c.foundItemId && <div className="btnrow" style={{ marginTop: 8 }}><Link href={`/items/${c.foundItemId}`}>{t('Open the item')}</Link></div>}
        </Expandable>
      )) : <Empty art="verify" title={t('No claims to verify.')} text={t('New claims appear here. You compare the answers with the private details.')} />)}

      {cur === 'pickups' && (pickups.length ? pickups.map((c, n) => (
        <Expandable key={c.id} open={n === 0} tone="done"
          head={<>
            <span className="icon-chip green"><Icon name="ticket" /></span>
            <div className="grow"><b>{c.itemTitle}</b><div className="meta">{t('Owner: {name}', { name: c.claimantName ?? '' })} · {c.itemCode}</div></div>
            {c.atOffice ? <span className="badge ok">{t('Shelf {shelf}', { shelf: c.shelf ?? '—' })}</span>
              : <span className="badge">{t(c.handedIn ? 'Finder says it is at the office' : 'Still with the finder')}</span>}
          </>}>
          {!c.atOffice && (
            <Callout>
              {c.handedIn
                ? <><b>{t('The finder says the item is at the office')}</b><div className="meta">{t('Confirm it in "From finders" (add the shelf) first.')}</div></>
                : <><b>{t('The item is still with the finder')}</b><div className="meta">{t('Ask {name} to bring it to the office, then hand it to the owner here.', { name: c.finderName ?? '' })}</div></>}
            </Callout>
          )}
          <HandoverForm id={c.id} hasCode={!!c.hasCode} ready={!!c.atOffice} />
        </Expandable>
      )) : <Empty art="done" title={t('No pickups waiting.')} text={t('Approved claims appear here until the owner collects the item.')} />)}

      {cur === 'finders' && (
        <>
          <p className="meta" style={{ marginTop: -6 }}>{t('Posted by members and already listed for everyone. When the finder brings one to the office, record it here.')}</p>
          {outside.length ? outside.map(i => (
            <div key={i.id} className="box" style={{ display: 'flex', gap: 14, alignItems: 'center', marginBottom: 10, flexWrap: 'wrap' }}>
              <span className={'icon-chip ' + (i.handedInAt ? 'green' : '')}><Icon name={i.handedInAt ? 'inbox' : 'hand'} /></span>
              <div style={{ flex: 1, minWidth: 200 }}>
                <Link href={`/items/${i.id}`}><b>{i.title}</b></Link>
                <div className="meta">{placeDate(i.place, i.date, t)} · {t('Found by: {name}', { name: i.reporterName })}</div>
              </div>
              {i.handedInAt && <span className="badge ok">{t('Finder says it is at the office')}</span>}
              <Link className={i.handedInAt ? 'btn' : 'btn sec'} href={`/register?receive=${i.id}`}>{t(i.handedInAt ? 'Confirm and add shelf' : 'Brought to the office')}</Link>
            </div>
          )) : <Empty art="empty" title={t('No found items are waiting outside the office.')} />}
        </>
      )}
    </>
  );
}

import Link from 'next/link';
import { requirePage } from '@/lib/auth';
import { STEPS, statusName } from '@/lib/constants';
import { getLinkCandidates, getMatchPairs, getOrgItems } from '@/lib/data';
import { getT } from '@/lib/i18n-server';
import { scoreClass, scoreMatch } from '@/lib/match';
import { GoogleMap } from '@/components/GoogleMap';
import { CsvButton, PrintButton } from '@/components/ClientBits';
import { CategoryArt, Icon } from '@/components/Icon';
import { Empty } from '@/components/Illustration';
import { LinkManuallyButton, RejectMatchButton } from '@/components/MatchButtons';
import { pickTab, Tabs, type TabDef } from '@/components/Tabs';
import { Head, href, KindBadge, LinkChips, placeDate } from '@/components/ui';

const FILTERS = ['All', ...STEPS, 'Closed'];

/** Every item in the organization: list, system matches, and map. Click an item for its full history. */
export default async function ItemsPage({ searchParams }: { searchParams: Promise<{ tab?: string; f?: string; q?: string; view?: string }> }) {
  const { user } = await requirePage({ roles: ['staff', 'admin'] });
  const orgId = user.organizationId!;
  const [{ tab, f = 'All', q = '', view = 'list' }, t, items, pairs] = await Promise.all([searchParams, getT(), getOrgItems(orgId), getMatchPairs(orgId)]);
  const tabs: TabDef[] = [
    { key: 'list', label: 'All items', icon: 'list', count: items.length },
    { key: 'matches', label: 'Matches', icon: 'search', count: pairs.length },
    { key: 'map', label: 'Map', icon: 'map' },
  ];
  const cur = pickTab(tabs, tab);

  return (
    <>
      <Head title={t('Item list')} sub={t('Every item in your organization. Click one to see its full history.')} />
      <Tabs tabs={tabs} current={cur} base="/items" t={t} />
      {cur === 'list' && <ItemList items={items} f={f} q={q} view={view === 'photos' ? 'photos' : 'list'} t={t} />}
      {cur === 'matches' && <Matches orgId={orgId} pairs={pairs} t={t} />}
      {cur === 'map' && <ItemMap items={items} t={t} />}
    </>
  );
}

type Items = Awaited<ReturnType<typeof getOrgItems>>;
type T = Awaited<ReturnType<typeof getT>>;

/** All items as a table, or as photo cards (?view=photos). Filters and search apply to both. */
function ItemList({ items, f, q, view, t }: { items: Items; f: string; q: string; view: 'list' | 'photos'; t: T }) {
  const needle = q.trim().toLowerCase();
  const list = items.filter(i =>
    (f === 'All' || statusName(i.status) === f) &&
    (!needle || `${i.title} ${i.itemCode ?? ''} ${i.place} ${i.reporterName}`.toLowerCase().includes(needle)));
  const csv: (string | number)[][] = [
    ['Code', 'Type', 'Item', 'Category', 'Place', 'Date', 'Status', 'Shelf', 'Reported by', 'Reported at'],
    ...list.map(i => [i.itemCode ?? '', i.kind, i.title, i.category, i.place, i.date ?? '', statusName(i.status), i.shelf ?? '', i.reporterName, i.createdAt]),
  ];
  return (
    <>
      <LinkChips options={FILTERS} current={f} t={t} make={o => href('/items', { f: o === 'All' ? '' : o, q, view: view === 'photos' ? 'photos' : '' })} />
      <form className="toolbar">
        {f !== 'All' && <input type="hidden" name="f" value={f} />}
        {view === 'photos' && <input type="hidden" name="view" value="photos" />}
        <input name="q" defaultValue={q} placeholder={t('Search items')} />
        <button className="btn sec">{t('Search')}</button>
        <span className="grow" />
        <div className="seg" style={{ margin: 0 }}>
          <Link href={href('/items', { f: f === 'All' ? '' : f, q })} className={'segl' + (view === 'list' ? ' on' : '')}><Icon name="list" size={16} />{t('List')}</Link>
          <Link href={href('/items', { f: f === 'All' ? '' : f, q, view: 'photos' })} className={'segl' + (view === 'photos' ? ' on' : '')}><Icon name="grid" size={16} />{t('Photos')}</Link>
        </div>
        <CsvButton filename="items.csv" rows={csv} />
        <PrintButton />
      </form>
      {view === 'photos' ? (list.length ? (
        <div className="grid">
          {list.map(i => (
            <Link key={i.id} href={`/items/${i.id}`} className="box" style={{ color: 'inherit', textDecoration: 'none', display: 'flex', flexDirection: 'column' }}>
              {i.hasPhoto
                ? <div className="thumb"><img src={`/api/items/${i.id}/photo`} alt="" loading="lazy" /><span className="cat">{t(i.category)}</span></div>
                : <CategoryArt category={i.category} big />}
              <b style={{ color: 'var(--ink)' }}>{i.title}</b>
              <div className="meta">{placeDate(i.place, i.date, t)}</div>
              <div className="pillrow" style={{ marginBottom: 0 }}>
                <KindBadge kind={i.kind} t={t} />
                <span className={'badge ' + (i.status === 5 ? 'ok' : i.status === 6 ? 'no' : '')}>{t(statusName(i.status))}</span>
              </div>
              <div className="meta" style={{ marginTop: 'auto', paddingTop: 8 }}>{i.itemCode ?? '—'}{i.shelf ? ` · ${t('Shelf {shelf}', { shelf: i.shelf })}` : ''} · {i.reporterName}</div>
            </Link>
          ))}
        </div>
      ) : <Empty art="search" title={t('No items match.')} />) : (
      <table>
        <thead><tr><th></th><th>{t('Item')}</th><th>{t('Type')}</th><th>{t('Place')}</th><th>{t('Status')}</th><th>{t('Item code')}</th><th>{t('Shelf')}</th></tr></thead>
        <tbody>
          {list.length ? list.map(i => (
            <tr key={i.id}>
              <td style={{ width: 56 }}>{i.hasPhoto
                ? <img src={`/api/items/${i.id}/photo`} alt="" loading="lazy" className="rowthumb" />
                : <CategoryArt category={i.category} size={36} />}</td>
              <td><Link href={`/items/${i.id}`}>{i.title}</Link><div className="meta">{t(i.category)} · {i.reporterName}</div></td>
              <td><KindBadge kind={i.kind} t={t} /></td>
              <td>{placeDate(i.place, i.date, t)}</td>
              <td><span className={'badge ' + (i.status === 5 ? 'ok' : i.status === 6 ? 'no' : '')}>{t(statusName(i.status))}</span></td>
              <td>{i.itemCode ?? '—'}</td>
              <td>{i.shelf ?? '—'}</td>
            </tr>
          )) : <tr><td colSpan={7} className="meta">{t('No items match.')}</td></tr>}
        </tbody>
      </table>
      )}
    </>
  );
}

async function Matches({ orgId, pairs, t }: { orgId: number; pairs: Awaited<ReturnType<typeof getMatchPairs>>; t: T }) {
  const candidates = await getLinkCandidates(orgId);
  return (
    <>
      <div className="toolbar">
        <span className="meta">{t('Check what the system suggested, remove wrong matches, or link items by hand.')}</span>
        <span className="grow" /><LinkManuallyButton lost={candidates.lost} found={candidates.found} />
      </div>
      {pairs.length === 0 && <Empty art="search" title={t('There are no open matches.')} />}
      {pairs.map(p => {
        const { score, why } = scoreMatch({ place: p.lostPlace, date: p.lostDate, lat: p.lostLat, lng: p.lostLng }, { place: p.foundPlace, date: p.foundDate, lat: p.foundLat, lng: p.foundLng });
        return (
          <div className="box" key={p.lostId} style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', gap: 18, alignItems: 'center', flexWrap: 'wrap' }}>
              <div className="cmp" style={{ flex: 1, minWidth: 260, margin: 0 }}>
                <div><span className="meta">{t('Lost report')}</span><br /><Link href={`/items/${p.lostId}`}><b>{p.lostTitle}</b></Link> · {p.ownerName}<div className="meta">{placeDate(p.lostPlace, p.lostDate, t)}</div></div>
                <div><span className="meta">{t('Found item')}</span><br /><Link href={`/items/${p.foundId}`}><b>{p.foundTitle}</b></Link> · {p.foundCode ?? '—'}<div className="meta">{placeDate(p.foundPlace, p.foundDate, t)}</div></div>
              </div>
              <div style={{ textAlign: 'center' }}><div className={'score ' + scoreClass(score)}>{score}%</div><div className="meta">{t('Confidence')}</div></div>
            </div>
            <div className="pillrow">
              {why.map(w => <span className="pill" key={w}>{t(w)}</span>)}
              {p.claimStatus && <span className="pill mid">{t('Claim: {status}', { status: t(p.claimStatus === 'pending' ? 'Pending' : p.claimStatus === 'approved' ? 'Approved' : 'Rejected') })}</span>}
            </div>
            {p.lostStatus < 4 && <div className="btnrow" style={{ marginTop: 6 }}><RejectMatchButton lostId={p.lostId} label="Not a match" /></div>}
          </div>
        );
      })}
    </>
  );
}

function ItemMap({ items, t }: { items: Items; t: T }) {
  const open = items.filter(i => i.kind === 'found' && i.status >= 2 && i.status <= 4);
  const lost = items.filter(i => i.kind === 'lost' && i.status < 5);
  const pin = (i: Items[number], accent: boolean) => ({ id: i.id, lat: i.lat!, lng: i.lng!, title: i.title, sub: `${t(i.kind === 'lost' ? 'Lost' : 'Found')} · ${placeDate(i.place, i.date, t)}`, href: `/items/${i.id}`, accent });
  const markers = [...open.filter(i => i.lat != null).map(i => pin(i, false)), ...lost.filter(i => i.lat != null).map(i => pin(i, true))];
  return (
    <>
      <GoogleMap markers={markers} height={420} />
      <p className="meta" style={{ marginTop: -6 }}>{t('Blue pins: found items waiting for owners. Orange pins: open lost reports. Tap a pin for details.')}</p>
      <div className="grid">
        {open.map(i => (
          <Link key={i.id} href={`/items/${i.id}`} className="box" style={{ display: 'flex', gap: 12, alignItems: 'center', textDecoration: 'none', color: 'inherit' }}>
            <CategoryArt category={i.category} />
            <div><b style={{ color: 'var(--ink)' }}>{i.title}</b><div className="meta">{placeDate(i.place, i.date, t)}</div></div>
          </Link>
        ))}
      </div>
    </>
  );
}

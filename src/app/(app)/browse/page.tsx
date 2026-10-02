import Link from 'next/link';
import { requirePage } from '@/lib/auth';
import { BROWSE_CATEGORIES } from '@/lib/constants';
import { getBrowseItems } from '@/lib/data';
import { getT } from '@/lib/i18n-server';
import { GoogleMap } from '@/components/GoogleMap';
import { ClaimButton } from '@/components/ClaimButton';
import { CategoryArt, Icon } from '@/components/Icon';
import { Empty } from '@/components/Illustration';
import { Head, href, placeDate } from '@/components/ui';

/** Found items everyone in the community can see, as a grid or on the campus map. Private details stay hidden. */
export default async function BrowsePage({ searchParams }: { searchParams: Promise<{ cat?: string; q?: string; view?: string }> }) {
  const { user } = await requirePage({ membership: true });
  const { cat = 'All', q = '', view = 'grid' } = await searchParams;
  const [t, all] = await Promise.all([getT(), getBrowseItems(user.organizationId!, cat, user.id)]);
  const needle = q.trim().toLowerCase();
  const items = all.filter(i => i.status >= 2 && (!needle || `${i.title} ${i.place}`.toLowerCase().includes(needle)));
  const list = items;
  const pins = items.filter(i => i.lat != null && i.lng != null)
    .map(i => ({ id: i.id, lat: i.lat!, lng: i.lng!, title: i.title, sub: placeDate(i.place, i.date, t), href: `/items/${i.id}` }));
  const link = (p: Record<string, string>) => href('/browse', { cat: cat === 'All' ? '' : cat, q, view: view === 'grid' ? '' : view, ...p });

  return (
    <>
      <Head title={t('Found items')} sub={t('Items people found in your community. Private details are hidden so only the owner can describe them.')} />
      <form className="toolbar">
        {cat !== 'All' && <input type="hidden" name="cat" value={cat} />}
        {view !== 'grid' && <input type="hidden" name="view" value={view} />}
        <input name="q" defaultValue={q} placeholder={t('Search found items')} style={{ maxWidth: 320, flex: 1 }} />
        <button className="btn sec"><Icon name="search" size={16} />{t('Search')}</button>
        <span className="grow" />
        <div className="seg" style={{ margin: 0 }}>
          <Link href={link({ view: '' })} className={'segl' + (view !== 'map' ? ' on' : '')}><Icon name="grid" size={16} />{t('Grid')}</Link>
          <Link href={link({ view: 'map' })} className={'segl' + (view === 'map' ? ' on' : '')}><Icon name="map" size={16} />{t('Map')}</Link>
        </div>
      </form>
      <div className="chips">
        {BROWSE_CATEGORIES.map(c => <Link key={c} href={link({ cat: c === 'All' ? '' : c })} className={cat === c ? 'on' : ''}>{t(c)}</Link>)}
      </div>

      {view === 'map' && (
        <>
          <GoogleMap markers={pins} height={380} />
          <p className="meta" style={{ marginTop: -6 }}>{t('Tap a pin to see the item.')}{pins.length < items.length ? ' ' + t('{n} items have no map pin and are only in the list.', { n: items.length - pins.length }) : ''}</p>
        </>
      )}

      {list.length ? (
        <div className="grid">
          {list.map(i => (
            <div className="box" key={i.id} style={{ display: 'flex', flexDirection: 'column' }}>
              <Link href={`/items/${i.id}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                {i.hasPhoto
                  ? <div className="thumb"><img src={`/api/items/${i.id}/photo`} alt="" /><span className="cat">{t(i.category)}</span></div>
                  : <CategoryArt category={i.category} big />}
                <b style={{ color: 'var(--ink)' }}>{i.title}</b>
                <div className="meta" style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Icon name="pin" size={14} />{placeDate(i.place, i.date, t)}</div>
              </Link>
              <div style={{ marginTop: 'auto', paddingTop: 14, display: 'flex', gap: 8 }}>
                {i.status >= 4
                  ? <span className="badge ok">{t('Owner found')}</span>
                  : i.mine ? <span className="badge">{t('You posted this')}</span>
                  : user.role !== 'member' ? null
                  : <ClaimButton itemId={i.id} label="This is mine" className="btn sec" />}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <Empty art="search" title={t('No found items here yet.')} text={t('Try another category, or report what you lost so we can tell you when it turns up.')}>
          <Link className="btn" href="/report">{t('I lost something')}</Link>
        </Empty>
      )}
    </>
  );
}

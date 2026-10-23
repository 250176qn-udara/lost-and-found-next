import Link from 'next/link';
import { requirePage } from '@/lib/auth';
import { SENSITIVE_CATEGORIES } from '@/lib/constants';
import { getOrgSettings } from '@/lib/settings';
import { getBrowseItems, getPlaces } from '@/lib/data';
import { getT } from '@/lib/i18n-server';
import { MapView } from '@/components/MapView';
import { FloorPlan, type PlaceCount } from '@/components/FloorPlan';
import { ClaimButton } from '@/components/ClaimButton';
import { CategoryArt, Icon } from '@/components/Icon';
import { Empty } from '@/components/Illustration';
import { Head, href, placeDate, when } from '@/components/ui';
import { getHelpWanted } from '@/lib/community';
import { getPrefs } from '@/lib/prefs';
import { buildingOf } from '@/lib/places';
import { AlertAreas, SightingButton } from '@/components/Community';

/** Found items everyone in the community can see, as a grid or on the campus map. Private details stay hidden. */
export default async function BrowsePage({ searchParams }: { searchParams: Promise<{ cat?: string; q?: string; view?: string; place?: string }> }) {
  const { user } = await requirePage({ membership: true });
  const { cat = 'All', q = '', view = 'grid', place = '' } = await searchParams;
  const [t, all, settings, places, help, prefs] = await Promise.all([getT(), getBrowseItems(user.organizationId!, cat, user.id), getOrgSettings(user.organizationId!), getPlaces(user.organizationId!),
    getHelpWanted(user.organizationId!, user.id), getPrefs(user.id)]);
  const buildings = [...new Set([...places.map(p => buildingOf(p.name)), ...help.map(h => h.building)])].sort((a, b) => (a === 'Other' ? 1 : b === 'Other' ? -1 : a.localeCompare(b)));
  // Sensitive items stay off the shared list for members; the owner is still told through matching.
  const hidden = (i: (typeof all)[number]) => settings.hideSensitive && user.role === 'member' && !i.mine && !i.myClaim && SENSITIVE_CATEGORIES.includes(i.category);
  const needle = q.trim().toLowerCase();
  const items = all.filter(i => i.status >= 2 && !hidden(i) && (!needle || `${i.title} ${i.place}`.toLowerCase().includes(needle)));
  const list = place ? items.filter(i => i.place === place) : items;
  const counts: Record<string, PlaceCount> = {};
  for (const i of items) counts[i.place] = { n: (counts[i.place]?.n ?? 0) + 1 };
  const pins = items.filter(i => i.lat != null && i.lng != null)
    .map(i => ({ id: i.id, lat: i.lat!, lng: i.lng!, title: i.title, sub: placeDate(i.place, i.date, t), href: `/items/${i.id}` }));
  const link = (p: Record<string, string>) => href('/browse', { cat: cat === 'All' ? '' : cat, q, view: view === 'grid' ? '' : view, place, ...p });

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
          <Link href={link({ view: '', place: '' })} className={'segl' + (view === 'grid' ? ' on' : '')}><Icon name="grid" size={16} />{t('Grid')}</Link>
          <Link href={link({ view: 'plan' })} className={'segl' + (view === 'plan' ? ' on' : '')}><Icon name="shelf" size={16} />{t('Floor plan')}</Link>
          <Link href={link({ view: 'map' })} className={'segl' + (view === 'map' ? ' on' : '')}><Icon name="map" size={16} />{t('Map')}</Link>
          <Link href={link({ view: 'help', place: '' })} className={'segl' + (view === 'help' ? ' on' : '')}>👀 {t('Seen these?')}{help.length > 0 && <span className="segcount">{help.length}</span>}</Link>
        </div>
      </form>
      {view !== 'help' && <div className="chips">
        {['All', ...settings.categories.filter(c => !(settings.hideSensitive && user.role === 'member' && SENSITIVE_CATEGORIES.includes(c)))].map(c => <Link key={c} href={link({ cat: c === 'All' ? '' : c })} className={cat === c ? 'on' : ''}>{t(c)}</Link>)}
      </div>}

      {view === 'plan' && (
        <>
          <FloorPlan places={[...places.map(p => p.name), ...items.map(i => i.place)]} counts={counts} selected={place || null}
            linkBase={link({ view: 'plan', place: '' }) + (link({ view: 'plan', place: '' }).includes('?') ? '&' : '?') + 'place='} />
          <p className="meta">{place
            ? <>{t('Showing items found at {place}.', { place: t(place) })} <Link href={link({ place: '' })}>{t('Show all')}</Link></>
            : t('Numbers show how many found items are waiting in each room. Tap a room to see them.')}</p>
        </>
      )}

      {view === 'map' && (
        <>
          <MapView markers={pins} height={380} />
          <p className="meta" style={{ marginTop: -6 }}>{t('Tap a pin to see the item.')}{pins.length < items.length ? ' ' + t('{n} items have no map pin and are only in the list.', { n: items.length - pins.length }) : ''}</p>
        </>
      )}

      {view === 'help' ? (
        <>
          <div className="helphead">
            <b>{t('Have you seen these?')}</b>
            <span className="meta">{t('Things people lost in the last 14 days. If you saw one, tell the owner, or post it if you found it. Only the name, place and date are shown.')}</span>
          </div>
          {user.role === 'member' && <AlertAreas buildings={buildings} initial={prefs.alertAreas} />}
          {help.length ? (
            <div className="grid">
              {help.map(h => (
                <div className="box helpcard" key={h.id} id={`i${h.id}`}>
                  {h.hasPhoto ? <div className="thumb"><img src={`/api/items/${h.id}/photo`} alt="" /><span className="cat">{t(h.category)}</span></div>
                    : <CategoryArt category={h.category} big />}
                  <span className="badge no" style={{ alignSelf: 'flex-start' }}>{t('Lost')}</span>
                  <b>{h.title}</b>
                  <div className="meta" style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Icon name="pin" size={14} />{placeDate(h.place, h.date, t)}</div>
                  <div className="meta">{t('Reported {time}', { time: when(h.createdAt) })}</div>
                  {user.role === 'member' && (
                    <div className="btnrow" style={{ marginTop: 'auto', paddingTop: 10 }}>
                      <SightingButton itemId={h.id} done={h.iSaw} />
                      <Link className="btn sec" href="/report?kind=found">🙌 {t('I found it')}</Link>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : <Empty art="search" title={t('Nobody is asking for help right now.')} text={t('When someone loses something and asks for help, it shows here.')} />}
        </>
      ) : list.length ? (
        <div className="grid">
          {list.map(i => (
            <div className="box" key={i.id} style={{ display: 'flex', flexDirection: 'column' }}>
              <Link href={`/items/${i.id}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                {i.hasPhoto
                  ? <div className="thumb"><img src={`/api/items/${i.id}/photo`} alt="" /><span className="cat">{t(i.category)}</span></div>
                  : <CategoryArt category={i.category} big />}
                <span className="kindbadge found">{t('Found')}</span>
                <b style={{ color: 'var(--ink)', display: 'block', marginTop: 4 }}>{i.title}</b>
                <div className="itemmeta">
                  <span><Icon name="box" size={14} />{t(i.category)}</span>
                  <span><Icon name="pin" size={14} />{t(i.place)}</span>
                  {i.date && <span><Icon name="clock" size={14} />{i.date}</span>}
                </div>
              </Link>
              <div style={{ marginTop: 'auto', paddingTop: 14, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <Link className="btn sec" href={`/items/${i.id}`}>{t('View details')}</Link>
                {i.myClaim ? (
                    <Link href="/my-items?tab=claims" className="claimed">
                      <Icon name="check" size={15} />
                      <span><b>{t('You claimed this')}</b><span>{t(i.myClaim === 'approved' ? 'Ready to pick up' : 'Checking your answers')}</span></span>
                    </Link>
                  )
                  : i.status >= 4 ? <span className="badge ok">{t('Owner found')}</span>
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

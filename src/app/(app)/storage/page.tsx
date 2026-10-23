import Link from 'next/link';
import { requirePage } from '@/lib/auth';
import { SHELF_CAPACITY } from '@/lib/constants';
import { getOrgSettings } from '@/lib/settings';
import { atOffice, getClosedItems, getOrgItems } from '@/lib/data';
import { getT } from '@/lib/i18n-server';
import { CsvButton } from '@/components/ClientBits';
import { CloseItemButton } from '@/components/CloseItemButton';
import { CategoryArt } from '@/components/Icon';
import { Empty } from '@/components/Illustration';
import { pickTab, Tabs, type TabDef } from '@/components/Tabs';
import { Head, href, Prog, Stat } from '@/components/ui';

/** Shelves, legal deadlines (police report, storage period) and items that left without their owner. */
export default async function StoragePage({ searchParams }: { searchParams: Promise<{ tab?: string; shelf?: string; code?: string }> }) {
  const { user } = await requirePage({ roles: ['staff', 'admin'] });
  const orgId = user.organizationId!;
  const [{ tab, shelf = '', code = '' }, t, all, closed, settings] = await Promise.all([searchParams, getT(), getOrgItems(orgId), getClosedItems(orgId), getOrgSettings(orgId)]);
  const { policeDays: POLICE_DAYS, storageDays: STORAGE_DAYS, shelves: SHELVES } = settings;
  const stored = all.filter(atOffice);
  const policeLate = stored.filter(i => (i.daysKept ?? 0) >= POLICE_DAYS);
  const tabs: TabDef[] = [
    { key: 'shelves', label: 'Shelves', icon: 'shelf', count: stored.length },
    { key: 'deadlines', label: 'Deadlines', icon: 'clock', count: policeLate.length },
    { key: 'closed', label: 'Closed items', icon: 'out', count: closed.length },
  ];
  const cur = pickTab(tabs, tab);

  return (
    <>
      <Head title={t('Storage')} sub={t('What is on the shelves, what is due, and what has left the office.')} />
      <Tabs tabs={tabs} current={cur} base="/storage" t={t} />

      {cur === 'shelves' && (() => {
        const shelves = [...new Set([...SHELVES, ...stored.map(i => i.shelf).filter((s): s is string => !!s)])];
        const q = code.trim().toUpperCase();
        const hit = q ? stored.find(i => i.itemCode === q) : undefined;
        const onShelf = stored.filter(i => i.shelf === shelf);
        return (
          <>
            <form className="toolbar">
              {shelf && <input type="hidden" name="shelf" value={shelf} />}
              <input name="code" defaultValue={code} placeholder={t('Item code')} />
              <button className="btn sec">{t('Find')}</button>
              {q && (hit ? <span className="pill">{hit.itemCode} → {hit.shelf ?? '—'}</span> : <span className="pill no">{t('No item with this code at the office')}</span>)}
            </form>
            <div className="shelfgrid">
              {shelves.map(s => {
                const n = stored.filter(i => i.shelf === s).length;
                const p = (n / SHELF_CAPACITY) * 100;
                return (
                  <Link key={s} href={href('/storage', { shelf: shelf === s ? '' : s, code })} className={'shelf' + (shelf === s ? ' sel' : '') + (hit?.shelf === s ? ' hit' : '')}>
                    <b>{s}</b><div className="meta">{n} / {SHELF_CAPACITY}</div>
                    <Prog pct={p} kind={p >= 90 ? 'bad' : p >= 70 ? 'warn' : ''} />
                  </Link>
                );
              })}
            </div>
            {shelf && (
              <>
                <h2>{t('Items on shelf {shelf}', { shelf })}</h2>
                {onShelf.length ? (
                  <div className="grid">
                    {onShelf.map(i => (
                      <Link key={i.id} href={`/items/${i.id}`} className="box" style={{ display: 'flex', gap: 12, alignItems: 'center', textDecoration: 'none', color: 'inherit' }}>
                        <CategoryArt category={i.category} />
                        <div><b style={{ color: 'var(--ink)' }}>{i.title}</b><div className="meta">{i.itemCode} · {t('{n} days', { n: i.daysKept ?? 0 })}</div></div>
                      </Link>
                    ))}
                  </div>
                ) : <Empty title={t('This shelf is empty.')} />}
              </>
            )}
          </>
        );
      })()}

      {cur === 'deadlines' && (
        <>
          <div className="grid">
            <Stat n={policeLate.length} label={t('Past the police deadline')} />
            <Stat n={stored.filter(i => (i.daysKept ?? 0) >= STORAGE_DAYS - 14).length} label={t('Storage period ending')} />
            <Stat n={t('{n} days', { n: POLICE_DAYS })} label={t('Report to police within')} />
            <Stat n={t('{n} days', { n: STORAGE_DAYS })} label={t('Storage period')} />
          </div>
          <p className="meta">{t('Japan’s Lost Property Act: a facility reports found items to the police within one week of receiving them, unless the owner collects them first.')}</p>
          {stored.length ? (
            <table>
              <thead><tr><th>{t('Item')}</th><th>{t('Shelf')}</th><th>{t('Days kept')}</th><th>{t('Police report')}</th><th>{t('Storage period')}</th><th></th></tr></thead>
              <tbody>
                {[...stored].sort((a, b) => (b.daysKept ?? 0) - (a.daysKept ?? 0)).map(i => {
                  const d = i.daysKept ?? 0;
                  const left = POLICE_DAYS - d;
                  return (
                    <tr key={i.id}>
                      <td><Link href={`/items/${i.id}`}>{i.title}</Link><div className="meta">{i.itemCode}</div></td>
                      <td>{i.shelf ?? '—'}</td>
                      <td>{d}</td>
                      <td>{left <= 0 ? <span className="badge no">{t('Overdue by {n} days', { n: -left })}</span> : left <= 2 ? <span className="badge">{t('{n} days left', { n: left })}</span> : <span className="badge ok">{t('{n} days left', { n: left })}</span>}</td>
                      <td style={{ minWidth: 120 }}><Prog pct={(d / STORAGE_DAYS) * 100} kind={d >= STORAGE_DAYS ? 'bad' : STORAGE_DAYS - d <= 14 ? 'warn' : ''} /></td>
                      <td><CloseItemButton itemId={i.id} preset={left <= 0 ? 'Handed to police' : undefined} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : <Empty art="done" title={t('Nothing is stored at the office.')} />}
        </>
      )}

      {cur === 'closed' && (closed.length ? (
        <>
          <div className="toolbar"><span className="grow" /><CsvButton filename="closed-items.csv" rows={[['Code', 'Item', 'Method', 'Note', 'Date', 'By'], ...closed.map(c => [c.itemCode ?? '', c.title, c.method, c.note ?? '', c.at, c.by ?? ''])]} /></div>
          <table>
            <thead><tr><th>{t('Item')}</th><th>{t('Method')}</th><th>{t('Note')}</th><th>{t('Date')}</th><th>{t('By')}</th></tr></thead>
            <tbody>{closed.map(c => <tr key={c.id}><td><Link href={`/items/${c.id}`}>{c.title}</Link><div className="meta">{c.itemCode}</div></td><td>{t(c.method)}</td><td>{c.note ?? '—'}</td><td>{c.at.slice(0, 10)}</td><td>{c.by ?? '—'}</td></tr>)}</tbody>
          </table>
        </>
      ) : <Empty art="empty" title={t('No items have been closed.')} text={t('Items handed to the police, donated or disposed of are recorded here.')} />)}
    </>
  );
}

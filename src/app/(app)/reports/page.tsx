import { requirePage } from '@/lib/auth';
import { getT } from '@/lib/i18n-server';
import { getAuditLog, getHotspots, getMonthReport, getReportMonths, monthName, pct } from '@/lib/stats';
import { CampusMap } from '@/components/CampusMap';
import { CsvButton, PrintButton, SelectNav } from '@/components/ClientBits';
import { Empty } from '@/components/Illustration';
import { pickTab, Tabs, type TabDef } from '@/components/Tabs';
import { Bars, Callout, Head, href, LinkChips, Prog, Stat, when } from '@/components/ui';

type T = Awaited<ReturnType<typeof getT>>;
const AREAS = ['All', 'Items', 'Claims', 'Membership'];

/** Insights: monthly report, where things get lost, and the audit log. */
export default async function InsightsPage({ searchParams }: { searchParams: Promise<{ tab?: string; m?: string; a?: string }> }) {
  const { user } = await requirePage({ roles: ['admin'] });
  const orgId = user.organizationId!;
  const [{ tab, m, a = 'All' }, t] = await Promise.all([searchParams, getT()]);
  const tabs: TabDef[] = [
    { key: 'report', label: 'Monthly report', icon: 'chart' },
    { key: 'hotspots', label: 'Hotspots', icon: 'map' },
    { key: 'audit', label: 'Audit log', icon: 'list' },
  ];
  const cur = pickTab(tabs, tab);
  return (
    <>
      <Head title={t('Insights')} sub={t('Reports you can save or print, where items get lost, and who did what.')} />
      <Tabs tabs={tabs} current={cur} base="/reports" t={t} />
      {cur === 'report' && <Report orgId={orgId} m={m} t={t} />}
      {cur === 'hotspots' && <Hotspots orgId={orgId} t={t} />}
      {cur === 'audit' && <Audit orgId={orgId} a={a} t={t} />}
    </>
  );
}

async function Report({ orgId, m, t }: { orgId: number; m?: string; t: T }) {
  const months = await getReportMonths(orgId);
  const month = m && months.includes(m) ? m : months[0];
  if (!month) return <Empty art="empty" title={t('No items yet.')} />;
  const r = await getMonthReport(orgId, month);
  const label = (ym: string) => `${t(monthName(ym))} ${ym.slice(0, 4)}`;
  const csv: (string | number)[][] = [
    ['Month', 'Category', 'Lost reports', 'Found items', 'Returned', 'Return rate'],
    ...r.rows.map(c => [month, c.category, c.lost, c.found, c.returned, pct(c.returned, c.found) + '%']),
  ];
  return (
    <>
      <div className="toolbar">
        <SelectNav value={month} makeHref="/reports?m={v}" options={months.map(x => [x, label(x)])} />
        <span className="grow" />
        <CsvButton filename={`report-${month}.csv`} rows={csv} />
        <PrintButton />
      </div>
      <div className="grid">
        <Stat n={r.lost} label={t('Lost reports')} />
        <Stat n={r.found} label={t('Found items')} />
        <Stat n={r.returned} label={t('Returned to owners')} />
        <Stat n={r.rate + '%'} label={t('Return rate')} />
      </div>
      <h2>{t('By category')}</h2>
      <table>
        <thead><tr><th>{t('Category')}</th><th>{t('Lost reports')}</th><th>{t('Found items')}</th><th>{t('Returned')}</th><th>{t('Return rate')}</th></tr></thead>
        <tbody>
          {r.rows.map(c => (
            <tr key={c.category}>
              <td>{t(c.category)}</td><td>{c.lost}</td><td>{c.found}</td><td>{c.returned}</td>
              <td style={{ minWidth: 140 }}><Prog pct={pct(c.returned, c.found)} /> <span className="meta">{pct(c.returned, c.found)}%</span></td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="meta">{t('Return rate = found items from this month that are already back with their owner.')}</p>
    </>
  );
}

async function Hotspots({ orgId, t }: { orgId: number; t: T }) {
  const h = await getHotspots(orgId);
  const max = Math.max(1, ...h.places.map(p => p[1]));
  const busiest = [...h.hours].sort((x, y) => y[1] - x[1])[0];
  return (
    <>
      <CampusMap counts={Object.fromEntries(h.places)} t={t} mode="heat" />
      <div className="cols even">
        <div>
          <h2>{t('Ranking')}</h2>
          {h.places.length ? h.places.map(([place, n]) => (
            <div className="heatrow" key={place}>
              <span>{t(place)}</span>
              <Prog pct={(n / max) * 100} kind={n / max > 0.7 ? 'bad' : n / max > 0.4 ? 'warn' : ''} />
              <b>{n}</b>
            </div>
          )) : <div className="box meta">{t('No items yet.')}</div>}
        </div>
        <div><h2>{t('When reports are made')}</h2><Bars data={h.hours} /></div>
      </div>
      {busiest && busiest[1] > 0 && <Callout kind="teal">{t('Most reports are made between {time}. A reminder at that time could help.', { time: busiest[0] })}</Callout>}
    </>
  );
}

async function Audit({ orgId, a, t }: { orgId: number; a: string; t: T }) {
  const log = await getAuditLog(orgId);
  const rows = log.filter(r => a === 'All' || r.area === a);
  return (
    <>
      <div className="toolbar">
        <LinkChips options={AREAS} current={a} t={t} make={o => href('/reports', { tab: 'audit', a: o === 'All' ? '' : o })} />
        <span className="grow" />
        <CsvButton filename="audit-log.csv" rows={[['Time', 'Area', 'Action', 'By', 'Target'], ...rows.map(r => [r.at, r.area, r.action, r.who ?? '', r.target])]} />
      </div>
      <table>
        <thead><tr><th>{t('Time')}</th><th>{t('Action')}</th><th>{t('By')}</th><th>{t('Target')}</th></tr></thead>
        <tbody>
          {rows.length ? rows.map((r, i) => <tr key={i}><td>{when(r.at)}</td><td>{t(r.action)}</td><td>{r.who ?? '—'}</td><td>{r.target}</td></tr>)
            : <tr><td colSpan={4} className="meta">{t('Nothing here yet.')}</td></tr>}
        </tbody>
      </table>
      <p className="meta">{t('Shows the latest 200 events. Logins are not recorded yet.')}</p>
    </>
  );
}

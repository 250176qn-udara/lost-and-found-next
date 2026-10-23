import Link from 'next/link';
import { requirePage } from '@/lib/auth';
import { COLORS, SHELF_CAPACITY } from '@/lib/constants';
import { atOffice, getMatchPairs, getOrgItems } from '@/lib/data';
import { SuggestedMatches } from '@/components/Dashboard';
import { getT } from '@/lib/i18n-server';
import { getAlertCounts, getDashboard } from '@/lib/stats';
import { Icon } from '@/components/Icon';
import { Empty, Illustration } from '@/components/Illustration';
import { Bars } from '@/components/ui';
import { CountUp, DonutChart } from '@/components/Animated';

type Sev = 'High' | 'Medium' | 'Low';
const SEV: Record<Sev, [badge: string, chip: string]> = { High: ['no', 'red'], Medium: ['', 'amber'], Low: ['ok', ''] };

/** Overview for admins: numbers, charts and a to-do list built from live data (it clears itself when the work is done). */
export default async function OverviewPage() {
  const { user } = await requirePage({ roles: ['admin'] });
  const orgId = user.organizationId!;
  const [t, d, c, items, pairs] = await Promise.all([getT(), getDashboard(orgId), getAlertCounts(orgId), getOrgItems(orgId), getMatchPairs(orgId)]);
  const openPairs = pairs.filter(p => p.lostStatus < 4 && !p.claimStatus);

  const perShelf = new Map<string, number>();
  for (const i of items.filter(atOffice)) if (i.shelf) perShelf.set(i.shelf, (perShelf.get(i.shelf) ?? 0) + 1);
  const fullShelves = [...perShelf].filter(([, n]) => n >= SHELF_CAPACITY * 0.9).map(([s]) => s);

  const todo: { sev: Sev; icon: string; title: string; text: string; to: string; n: number }[] = [
    { sev: 'High', icon: 'alert', title: 'Past the police deadline', text: t('At the office for a week or more: {n}. Report them to the police.', { n: c.policeLate }), to: '/storage?tab=deadlines', n: c.policeLate },
    { sev: 'High', icon: 'shield', title: 'Claims waiting for verification', text: t('Waiting more than 2 days: {n}.', { n: c.oldClaims }), to: '/desk', n: c.oldClaims },
    { sev: 'Medium', icon: 'shield', title: 'Claims to verify', text: t('Waiting for a staff check: {n}.', { n: c.pendingClaims }), to: '/desk', n: c.pendingClaims - c.oldClaims },
    { sev: 'Medium', icon: 'ticket', title: 'Ready for handover', text: t('Owners who can collect their item: {n}.', { n: c.handovers }), to: '/desk?tab=pickups', n: c.handovers },
    { sev: 'Medium', icon: 'clock', title: 'Items expiring soon', text: t('Reaching the storage period within 14 days: {n}.', { n: c.expiring }), to: '/storage?tab=deadlines', n: c.expiring },
    { sev: 'Low', icon: 'hand', title: 'Still with the finder', text: t('Posted but not brought to the office for 3 days or more: {n}.', { n: c.oldQueue }), to: '/desk?tab=finders', n: c.oldQueue },
    { sev: 'Low', icon: 'shelf', title: 'Shelf almost full', text: fullShelves.join(', '), to: '/storage', n: fullShelves.length },
    { sev: 'Low', icon: 'users', title: 'Membership requests', text: t('People waiting to join: {n}.', { n: c.requests }), to: '/users', n: c.requests },
  ].filter(a => a.n > 0) as { sev: Sev; icon: string; title: string; text: string; to: string; n: number }[];

  const hour = Number(new Date().toLocaleString('en-US', { hour: 'numeric', hour12: false, timeZone: 'Asia/Tokyo' }));
  const greeting = hour < 11 ? 'Good morning, {name}' : hour < 18 ? 'Good afternoon, {name}' : 'Good evening, {name}';
  const urgent = todo.filter(a => a.sev === 'High').length;
  const kpis: { label: string; value: number | null; template?: string; icon: string; tone: string; to: string; pct?: number }[] = [
    { label: 'Items reported', value: d.total, icon: 'box', tone: 'blue', to: '/items' },
    { label: 'Returned to owners', value: d.returnRate, template: '{n}%', icon: 'check', tone: 'green', to: '/reports', pct: d.returnRate },
    { label: 'Average time to return', value: d.avgDays, template: t('{n} days', { n: '{n}' }), icon: 'clock', tone: 'amber', to: '/reports' },
    { label: 'Waiting for owners', value: d.waiting, icon: 'inbox', tone: 'violet', to: '/storage' },
  ];

  return (
    <>
      <div className="hero dash-hero">
        <div className="dash-hero-text">
          <span className="hero-kicker">{t('Overview')}</span>
          <h1>{t(greeting, { name: user.name })}</h1>
          <p>{urgent ? t('{n} urgent things need your attention today.', { n: urgent })
            : todo.length ? t('{n} things are waiting for you today.', { n: todo.length }) : t('Everything is under control today. Nice work!')}</p>
          <div className="btnrow" style={{ marginTop: 0 }}>
            <Link className="btn" href="/desk">{t('Open the front desk')}</Link>
            <Link className="btn sec" href="/register">{t('Register an item')}</Link>
          </div>
        </div>
        <Illustration name="office" size={190} className="hero-art" />
      </div>
      <div className="livebar"><span className="livedot" />{t('Live data')} · {t('Updated {time}', { time: new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Tokyo' }) })}</div>
      <div className="grid kpis">
        {kpis.map((k, i) => (
          <Link key={k.label} href={k.to} className={'box kpi ' + k.tone} style={{ animationDelay: `${i * 0.08}s` }}>
            <span className="icon-chip"><Icon name={k.icon} /></span>
            <b>{k.value === null ? '—' : <CountUp value={k.value} template={k.template} delay={i * 80} />}</b>
            <span className="kpi-label">{t(k.label)}</span>
            {k.pct !== undefined && <span className="kpi-bar"><i style={{ width: `${k.pct}%`, animationDelay: `${0.3 + i * 0.08}s` }} /></span>}
          </Link>
        ))}
      </div>

      <h2>{t('Needs attention')}</h2>
      {todo.length ? todo.map((a, i) => (
        <Link key={a.title} href={a.to} className={'box todo' + (a.sev === 'High' ? ' urgent' : '')} style={{ animationDelay: `${0.2 + i * 0.07}s` }}>
          <span className={'icon-chip ' + SEV[a.sev][1]}><Icon name={a.icon} /></span>
          <div style={{ flex: 1 }}><b style={{ color: 'var(--ink)' }}>{t(a.title)}</b> <span className={'badge ' + SEV[a.sev][0]}>{t(a.sev)}</span><div className="meta">{a.text}</div></div>
          <span className="todo-n">{a.n}</span>
          <Icon name="chevron" className="todo-go" />
        </Link>
      )) : <Empty art="done" title={t('Nothing needs attention right now.')} />}

      {openPairs.length > 0 && (
        <>
          <h2>✨ {t('Suggested matches')} <span className="meta">({openPairs.length})</span></h2>
          <SuggestedMatches pairs={openPairs.slice(0, 3)} t={t} reviewHref="/items?tab=matches" showOwner />
        </>
      )}

      <div className="cols even">
        <div><h2 className="h-art"><Illustration name="chart" size={46} />{t('Returns per month')}</h2><Bars data={d.returnsPerMonth.map(([m, n]) => [t(m), n])} /></div>
        <div>
          <h2 className="h-art"><Illustration name="campus" size={46} />{t('Items by category')}</h2>
          <div className="box">
            {d.byCategory.length ? <DonutChart totalLabel={t('items')} parts={d.byCategory.map(([cat, n], i) => [t(cat), n, COLORS[i % COLORS.length]])} /> : <span className="meta">{t('No items yet.')}</span>}
          </div>
        </div>
      </div>
    </>
  );
}

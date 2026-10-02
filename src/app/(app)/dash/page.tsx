import Link from 'next/link';
import { requirePage } from '@/lib/auth';
import { COLORS, SHELF_CAPACITY } from '@/lib/constants';
import { atOffice, getOrgItems } from '@/lib/data';
import { getT } from '@/lib/i18n-server';
import { getAlertCounts, getDashboard } from '@/lib/stats';
import { Icon } from '@/components/Icon';
import { Empty } from '@/components/Illustration';
import { Bars, Donut, Head, Stat } from '@/components/ui';

type Sev = 'High' | 'Medium' | 'Low';
const SEV: Record<Sev, [badge: string, chip: string]> = { High: ['no', 'red'], Medium: ['', 'amber'], Low: ['ok', ''] };

/** Overview for admins: numbers, charts and a to-do list built from live data (it clears itself when the work is done). */
export default async function OverviewPage() {
  const { user } = await requirePage({ roles: ['admin'] });
  const orgId = user.organizationId!;
  const [t, d, c, items] = await Promise.all([getT(), getDashboard(orgId), getAlertCounts(orgId), getOrgItems(orgId)]);

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

  return (
    <>
      <Head title={t('Overview')} sub={t('How lost and found is going in your organization.')} />
      <div className="grid">
        <Stat n={d.total} label={t('Items reported')} />
        <Stat n={d.returnRate + '%'} label={t('Returned to owners')} />
        <Stat n={d.avgDays === null ? '—' : t('{n} days', { n: d.avgDays })} label={t('Average time to return')} />
        <Stat n={d.waiting} label={t('Waiting for owners')} />
      </div>

      <h2>{t('Needs attention')}</h2>
      {todo.length ? todo.map(a => (
        <Link key={a.title} href={a.to} className="box" style={{ display: 'flex', gap: 14, alignItems: 'center', marginBottom: 10, color: 'inherit', textDecoration: 'none' }}>
          <span className={'icon-chip ' + SEV[a.sev][1]}><Icon name={a.icon} /></span>
          <div style={{ flex: 1 }}><b style={{ color: 'var(--ink)' }}>{t(a.title)}</b> <span className={'badge ' + SEV[a.sev][0]}>{t(a.sev)}</span><div className="meta">{a.text}</div></div>
          <Icon name="chevron" style={{ color: 'var(--faint)' }} />
        </Link>
      )) : <Empty art="done" title={t('Nothing needs attention right now.')} />}

      <div className="cols even">
        <div><h2>{t('Returns per month')}</h2><Bars data={d.returnsPerMonth.map(([m, n]) => [t(m), n])} /></div>
        <div>
          <h2>{t('Items by category')}</h2>
          <div className="box">
            {d.byCategory.length ? <Donut parts={d.byCategory.map(([cat, n], i) => [t(cat), n, COLORS[i % COLORS.length]])} /> : <span className="meta">{t('No items yet.')}</span>}
          </div>
        </div>
      </div>
    </>
  );
}

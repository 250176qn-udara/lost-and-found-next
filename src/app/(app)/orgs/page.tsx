import { requirePage } from '@/lib/auth';
import { getT } from '@/lib/i18n-server';
import { getAuditLog, getPlatformStats } from '@/lib/stats';
import { pickTab, Tabs, type TabDef } from '@/components/Tabs';
import { Bars, Head, href, LinkChips, Prog, Stat, when } from '@/components/ui';
import { AddOrganizationButton } from './AddOrganizationButton';

const AREAS = ['All', 'Items', 'Claims', 'Membership'];

// Super admin. The database has no "super admin" role yet, so nobody can open this page until one is added.
export default async function PlatformPage({ searchParams }: { searchParams: Promise<{ tab?: string; a?: string }> }) {
  await requirePage({ roles: ['super'] });
  const [{ tab, a = 'All' }, t, orgs] = await Promise.all([searchParams, getT(), getPlatformStats()]);
  const tabs: TabDef[] = [{ key: 'orgs', label: 'Organizations', icon: 'globe', count: orgs.length }, { key: 'audit', label: 'System audit', icon: 'list' }];
  const cur = pickTab(tabs, tab);
  const sum = (k: 'users' | 'items') => orgs.reduce((x, o) => x + o[k], 0);
  const log = cur === 'audit' ? (await getAuditLog(null)).filter(r => a === 'All' || r.area === a) : [];

  return (
    <>
      <Head title={t('Platform')} sub={t('Every school, company and store using the service.')} />
      <Tabs tabs={tabs} current={cur} base="/orgs" t={t} />
      {cur === 'orgs' && (
        <>
          <div className="grid">
            <Stat n={orgs.length} label={t('Organizations')} />
            <Stat n={sum('users')} label={t('Users')} />
            <Stat n={sum('items')} label={t('Items reported')} />
            <Stat n={(orgs.length ? Math.round(orgs.reduce((x, o) => x + o.rate, 0) / orgs.length) : 0) + '%'} label={t('Average return rate')} />
          </div>
          <h2>{t('Items per organization')}</h2>
          <Bars data={orgs.map(o => [t(o.name), o.items])} />
          <div className="toolbar" style={{ marginTop: 20 }}><span className="grow" /><AddOrganizationButton /></div>
          <table>
            <thead><tr><th>{t('Name')}</th><th>{t('Type')}</th><th>{t('Users')}</th><th>{t('Items')}</th><th>{t('Return rate')}</th></tr></thead>
            <tbody>{orgs.map(o => <tr key={o.id}><td><b>{t(o.name)}</b></td><td>{t(o.type)}</td><td>{o.users}</td><td>{o.items}</td><td style={{ minWidth: 120 }}><Prog pct={o.rate} /> <span className="meta">{o.rate}%</span></td></tr>)}</tbody>
          </table>
        </>
      )}
      {cur === 'audit' && (
        <>
          <LinkChips options={AREAS} current={a} t={t} make={o => href('/orgs', { tab: 'audit', a: o === 'All' ? '' : o })} />
          <table>
            <thead><tr><th>{t('Time')}</th><th>{t('Organization')}</th><th>{t('By')}</th><th>{t('Action')}</th><th>{t('Target')}</th></tr></thead>
            <tbody>
              {log.length ? log.map((r, i) => <tr key={i}><td>{when(r.at)}</td><td>{t(r.org)}</td><td>{r.who ?? '—'}</td><td>{t(r.action)}</td><td>{r.target}</td></tr>)
                : <tr><td colSpan={5} className="meta">{t('Nothing here yet.')}</td></tr>}
            </tbody>
          </table>
        </>
      )}
    </>
  );
}

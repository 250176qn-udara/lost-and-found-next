import { requirePage } from '@/lib/auth';
import { ROLE_NAMES } from '@/lib/constants';
import { getAdminData, getMemberRows } from '@/lib/data';
import { getT } from '@/lib/i18n-server';
import { getAuditLog, getStaffActivity } from '@/lib/stats';
import type { Role } from '@/lib/types';
import { Expandable } from '@/components/Expandable';
import { Icon } from '@/components/Icon';
import { Empty } from '@/components/Illustration';
import { pickTab, Tabs, type TabDef } from '@/components/Tabs';
import { Head, Kv, Prog, Timeline, when } from '@/components/ui';
import { MembershipButtons } from './MembershipButtons';
import { RemoveButton, RoleSelect } from './RoleControls';

// What each role can do: Member, Staff, Org admin.
const CAPS: [label: string, ...can: boolean[]][] = [
  ['Report and claim items', true, true, true],
  ['Verify claims and hand over', false, true, true],
  ['Register and store items', false, true, true],
  ['Manage people and roles', false, false, true],
  ['See insights and the audit log', false, false, true],
  ['Change settings', false, false, true],
];
const STAFF_ACTIONS = ['Item received at office', 'Claim approved', 'Claim rejected', 'Item handed over'];

/** People: join requests, members and their roles, and what staff handled. */
export default async function PeoplePage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { user } = await requirePage({ roles: ['admin'] });
  const orgId = user.organizationId!;
  const [{ tab }, t, { pending }, people] = await Promise.all([searchParams, getT(), getAdminData(orgId), getMemberRows(orgId)]);
  const tabs: TabDef[] = [
    { key: 'members', label: 'Members', icon: 'users', count: pending.length },
    { key: 'activity', label: 'Staff activity', icon: 'chart' },
  ];
  const cur = pickTab(tabs, tab);

  return (
    <>
      <Head title={t('People')} sub={t('Who can use lost and found in your organization, and what staff handled.')} />
      <Tabs tabs={tabs} current={cur} base="/users" t={t} />

      {cur === 'members' && (
        <>
          {pending.length > 0 && (
            <>
              <h2 style={{ marginTop: 0 }}>{t('Membership Requests')}</h2>
              {pending.map(r => (
                <div key={r.id} className="box" style={{ display: 'flex', gap: 14, alignItems: 'center', marginBottom: 10, flexWrap: 'wrap' }}>
                  <span className="icon-chip amber"><Icon name="user" /></span>
                  <div style={{ flex: 1, minWidth: 200 }}><b>{r.name}</b><div className="meta">{r.email}</div></div>
                  <MembershipButtons id={r.id} />
                </div>
              ))}
            </>
          )}
          <h2 style={pending.length ? undefined : { marginTop: 0 }}>{t('Members')} <span className="meta">({people.length})</span></h2>
          <table>
            <thead><tr><th>{t('Name')}</th><th>{t('Email')}</th><th>{t('Role')}</th><th>{t('Member since')}</th><th></th></tr></thead>
            <tbody>
              {people.map(p => {
                const self = p.userId === user.id;
                return (
                  <tr key={p.membershipId}>
                    <td><b>{p.name}</b>{self && <span className="meta"> ({t('you')})</span>}</td>
                    <td>{p.email}</td>
                    <td><RoleSelect membershipId={p.membershipId} role={p.role} disabled={self} /></td>
                    <td>{p.since ?? '—'}</td>
                    <td>{!self && <RemoveButton membershipId={p.membershipId} name={p.name} />}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div style={{ marginTop: 16 }}>
            <Expandable tone="muted" head={<><span className="icon-chip"><Icon name="shield" /></span><b className="grow">{t('What each role can do')}</b></>}>
              <table className="matrix">
                <thead><tr><th>{t('Permission')}</th><th>{t('Member')}</th><th>{t('Staff')}</th><th>{t('Org admin')}</th></tr></thead>
                <tbody>{CAPS.map(([label, ...can]) => <tr key={label}><td>{t(label)}</td>{can.map((c, i) => <td key={i}>{c ? '✓' : '—'}</td>)}</tr>)}</tbody>
              </table>
            </Expandable>
          </div>
        </>
      )}

      {cur === 'activity' && <Activity orgId={orgId} t={t} />}
    </>
  );
}

async function Activity({ orgId, t }: { orgId: number; t: Awaited<ReturnType<typeof getT>> }) {
  const [rows, log] = await Promise.all([getStaffActivity(orgId), getAuditLog(orgId, 100)]);
  const max = Math.max(1, ...rows.map(r => r.received + r.verified + r.returned));
  const latest = log.filter(l => STAFF_ACTIONS.includes(l.action)).slice(0, 8);
  return (
    <>
      <div className="grid">
        {rows.map(r => (
          <div className="box" key={r.name}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 8 }}>
              <span className="avatar">{r.name.replace(/^(Mr|Mrs|Ms|Dr)\.?\s+/i, '').split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase()}</span>
              <div><b>{r.name}</b><div className="meta">{t(ROLE_NAMES[r.role as Role])}</div></div>
            </div>
            <Kv label={t('Items received')} value={r.received} />
            <Kv label={t('Claims verified')} value={r.verified} />
            <Kv label={t('Items handed over')} value={r.returned} />
            <Prog pct={((r.received + r.verified + r.returned) / max) * 100} />
          </div>
        ))}
      </div>
      <h2>{t('Latest actions')}</h2>
      {latest.length
        ? <div className="box"><Timeline events={latest.map(l => ({ label: `${t(l.action)} · ${l.target}`, meta: `${l.who ?? '—'} · ${when(l.at)}`, on: true }))} /></div>
        : <Empty title={t('No staff actions yet.')} />}
    </>
  );
}

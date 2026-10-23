import { redirect } from 'next/navigation';
import { requirePage } from '@/lib/auth';
import { getOrganizations } from '@/lib/data';
import { getT } from '@/lib/i18n-server';
import type { Organization } from '@/lib/types';
import { Head } from '@/components/ui';
import { RefreshStatusButton, RequestButton } from './CommunityButtons';

export default async function CommunityPage() {
  const { user, pending } = await requirePage();
  if (user.role === 'super') redirect('/orgs');
  const [t, orgs] = await Promise.all([getT(), getOrganizations()]);
  const isMember = user.membershipStatus === 'approved' && !!user.organizationId;
  const current = isMember ? orgs.find(o => o.id === user.organizationId) : undefined;
  const pendOrg = pending ? orgs.find(o => o.id === pending.organizationId) : undefined;

  const card = (org: Organization) => (
    <div className="box" key={org.id}>
      <h2 style={{ marginTop: 0 }}>{t(org.name)}</h2>
      <div className="meta">{t(org.type)}</div>
      <RequestButton orgId={org.id} disabled={!!pending} />
    </div>
  );

  if (!isMember && pendOrg) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <h1>{t('Membership Request')}</h1>
          <div className="box">
            <h2>{t(pendOrg.name)}</h2>
            <span className="badge">{t('Pending')}</span>
            <p className="meta">{t('Your request has been sent to the organization administrator.')}</p>
          </div>
          <RefreshStatusButton />
        </div>
      </div>
    );
  }

  if (!isMember || !current) {
    return (
      <>
        <Head title={t('Find Your Community')} sub={t('Choose the school or organization you belong to.')} />
        <div className="grid">{orgs.map(card)}</div>
      </>
    );
  }

  return (
    <>
      <Head title={t('Your community')} sub={t('Choose the school or organization you belong to.')} />
      <div className="box" style={{ maxWidth: 480, marginBottom: 8 }}>
        <h2 style={{ marginTop: 0 }}>{t(current.name)}</h2>
        <div className="meta">{t(current.type)}</div>
        <p style={{ margin: '10px 0 0' }}><span className="badge ok">{t('Member')}</span></p>
      </div>
      {pendOrg && (
        <div className="box" style={{ maxWidth: 480, marginTop: 12, background: 'var(--amberbg)', borderColor: 'var(--amber)' }}>
          <b>{t(pendOrg.name)}</b> <span className="badge">{t('Pending')}</span>
          <div className="meta">{t('You stay in your current community until the new request is approved.')}</div>
        </div>
      )}
      <h2>{t('Other communities')}</h2>
      <div className="grid">{orgs.filter(o => o.id !== current.id).map(card)}</div>
    </>
  );
}

import Link from 'next/link';
import { requirePage } from '@/lib/auth';
import { GUIDE_URL, ROLE_NAMES } from '@/lib/constants';
import { getOrganizations } from '@/lib/data';
import { getT } from '@/lib/i18n-server';
import { LangButton } from '@/components/HeaderControls';
import { MockButton } from '@/components/ClientBits';
import { Expandable } from '@/components/Expandable';
import { Icon } from '@/components/Icon';
import { Illustration } from '@/components/Illustration';
import { pickTab, Tabs, type TabDef } from '@/components/Tabs';
import { Field, Head } from '@/components/ui';
import { PasswordForm, PrivacySwitches } from './ProfileForms';

const HOW: [art: string, title: string, text: string][] = [
  ['report', 'Report or post', 'Lost something? Report it. Found something? Post it so everyone can see it.'],
  ['search', 'Match and claim', 'The system suggests matches. The owner claims the item and describes it.'],
  ['verify', 'Check at the office', 'Staff compare the answers with private details and check a photo ID.'],
  ['done', 'Pick it up', 'The owner shows the pickup code and takes the item home.'],
];
const FAQ: [q: string, a: string][] = [
  ['Why must I show an ID?', 'Staff must be sure that the item goes to its owner.'],
  ['Why are some details hidden?', 'Found items show only general information. The owner must describe the rest, so nobody can copy the answers.'],
  ['Can I keep something I found?', 'No. Post it here and hand it to the office when someone claims it.'],
  ['How long are items kept?', 'Your organization sets the storage period. Items that are not collected are reported to the police, as the law requires.'],
  ['Is a thank-you required?', 'No. Thank-you messages and gifts are voluntary.'],
];

/** Account, community, privacy and help in one place. */
export default async function ProfilePage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { user, pending } = await requirePage();
  const [{ tab }, t, orgs] = await Promise.all([searchParams, getT(), getOrganizations()]);
  const org = orgs.find(o => o.id === user.organizationId);
  const pendOrg = pending ? orgs.find(o => o.id === pending.organizationId) : undefined;
  const tabs: TabDef[] = [
    { key: 'account', label: 'Account', icon: 'user' },
    { key: 'privacy', label: 'Privacy & data', icon: 'shield' },
    { key: 'help', label: 'How it works', icon: 'other' },
  ];
  const cur = pickTab(tabs, tab);

  return (
    <>
      <Head title={t('Account')} sub={t('Your profile, your community and help.')} />
      <Tabs tabs={tabs} current={cur} base="/profile" t={t} />

      {cur === 'account' && (
        <div className="cols even">
          <div>
            <div className="box" style={{ marginBottom: 16 }}>
              <h2 style={{ marginTop: 0 }}>{t('Profile')}</h2>
              <Field label={t('Name')}><input value={user.name} disabled /></Field>
              <Field label={t('Email')}><input value={user.email} disabled /></Field>
              <Field label={t('Role')}><input value={t(ROLE_NAMES[user.role])} disabled /></Field>
              <div className="sw"><span>{t('Language / 言語')}</span><span className="lang-on-light"><LangButton /></span></div>
            </div>
            <PasswordForm />
          </div>
          <div>
            <div className="box">
              <h2 style={{ marginTop: 0 }}>{t('Community')}</h2>
              {org ? (
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <span className="icon-chip green"><Icon name="users" /></span>
                  <div><b>{t(org.name)}</b><div className="meta">{t(org.type)} · <span className="badge ok">{t('Member')}</span></div></div>
                </div>
              ) : <p className="meta">{t('You have not joined a community yet.')}</p>}
              {pendOrg && <p className="meta" style={{ marginTop: 12 }}>{t('Waiting for approval: {org}', { org: t(pendOrg.name) })}</p>}
              {user.role === 'member' && <div className="btnrow"><Link className="btn sec" href="/community">{t(org ? 'Switch community' : 'Find your community')}</Link></div>}
            </div>
          </div>
        </div>
      )}

      {cur === 'privacy' && (
        <div className="cols even">
          <PrivacySwitches />
          <div className="box">
            <h2 style={{ marginTop: 0 }}>{t('Your data')}</h2>
            <p className="meta">{t('Download a copy of what the system stores about you.')}</p>
            <div className="btnrow">
              <a className="btn sec" href="/api/me/export" download><Icon name="out" size={16} />{t('Download my data')}</a>
              <MockButton label="Delete my account" msg="Please contact your administrator" className="btn bad" />
            </div>
          </div>
        </div>
      )}

      {cur === 'help' && (
        <>
          <a href={GUIDE_URL} className="guidecard">
            <Illustration name="search" size={96} />
            <span><b>{t('Try the interactive guide')}</b><span className="meta">{t('Follow one lost wallet from report to return, step by step. Takes about 2 minutes.')}</span></span>
            <span className="btn">{t('Start')} →</span>
          </a>
          <div className="howto">
            {HOW.map(([art, title, text]) => (
              <div className="box" key={title}><Illustration name={art} size={110} /><b>{t(title)}</b><p className="meta" style={{ margin: '4px 0 0' }}>{t(text)}</p></div>
            ))}
          </div>
          <h2>{t('Questions')}</h2>
          {FAQ.map(([q, a]) => (
            <Expandable key={q} tone="muted" head={<><span className="icon-chip"><Icon name="other" /></span><b className="grow">{t(q)}</b></>}>
              <p style={{ margin: 0 }}>{t(a)}</p>
            </Expandable>
          ))}
        </>
      )}
    </>
  );
}

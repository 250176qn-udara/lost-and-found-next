import type { ReactNode } from 'react';
import { requirePage } from '@/lib/auth';
import { ROLE_NAMES } from '@/lib/constants';
import { getMemberNotices, getStaffNotices } from '@/lib/data';
import { one } from '@/lib/db';
import { getT } from '@/lib/i18n-server';
import { Bell } from '@/components/Bell';
import { Nav } from '@/components/Nav';
import { LangButton, UserPill } from '@/components/HeaderControls';

/** App shell: sidebar (brand, organization, menu) + top bar (bell, language, account). Each page adds its own role checks. */
export default async function AppLayout({ children }: { children: ReactNode }) {
  const { user } = await requirePage();
  const t = await getT();
  const orgId = user.membershipStatus === 'approved' ? user.organizationId : null;
  const [org, notices] = await Promise.all([
    orgId ? one<{ name: string }>('SELECT name FROM organizations WHERE id = ?', [orgId]) : null,
    !orgId || user.role === 'super' ? [] : user.role === 'member' ? getMemberNotices(user.id, orgId) : getStaffNotices(orgId),
  ]);

  return (
    <div className="shell">
      <aside className="side">
        <div className="brand"><i></i>{t('Lost & Found')}</div>
        {org && <div className="org">{t(org.name)}</div>}
        <Nav role={user.role} />
      </aside>
      <div className="mainwrap">
        <header className="topbar">
          <span className="grow" />
          {orgId && user.role !== 'super' && <Bell ids={notices.map(n => n.id)} storageKey={`lf-read-${user.id}`} />}
          <LangButton />
          <UserPill name={user.name} role={t(ROLE_NAMES[user.role])} />
        </header>
        <main>{children}</main>
      </div>
    </div>
  );
}

import type { ReactNode } from 'react';
import { after } from 'next/server';
import { runFinderRemindersSoon } from '@/lib/reminders';
import { requirePage } from '@/lib/auth';
import { ROLE_NAMES } from '@/lib/constants';
import { getNotices } from '@/lib/data';
import { one } from '@/lib/db';
import { getT } from '@/lib/i18n-server';
import { Bell } from '@/components/Bell';
import { Nav } from '@/components/Nav';
import { LangButton, UserPill } from '@/components/HeaderControls';
import { Illustration } from '@/components/Illustration';

/** "Aiko" from "Aiko Tanaka", but the full name when it starts with a title ("Mr. Yamada"). */
const firstName = (name: string) => { const f = name.split(' ')[0]; return f.endsWith('.') ? name : f; };

/** App shell: sidebar (brand, organization, menu) + top bar (bell, language, account). Each page adds its own role checks. */
export default async function AppLayout({ children }: { children: ReactNode }) {
  const { user } = await requirePage();
  const t = await getT();
  // Finder reminders (time limit for keeping a found item): checked after the page is sent, at most every 10 minutes.
  after(() => runFinderRemindersSoon());
  const orgId = user.membershipStatus === 'approved' ? user.organizationId : null;
  const [org, notices] = await Promise.all([
    orgId ? one<{ name: string }>('SELECT name FROM organizations WHERE id = ?', [orgId]) : null,
    !orgId || user.role === 'super' ? [] : getNotices(user.id, user.role, orgId),
  ]);

  return (
    <div className="shell">
      <aside className="side">
        <div className="brand"><i></i>{t('Lost & Found')}</div>
        <div className="side-hello">
          <Illustration name="mascot" size={54} />
          <div><b>{t('Hello, {name}!', { name: firstName(user.name) })}</b><span>{t('Let’s help things find their way home.')}</span></div>
        </div>
        {org && <div className="org">{t(org.name)}</div>}
        <Nav role={user.role} />
      </aside>
      <div className="mainwrap">
        <header className="topbar">
          <span className="grow" />
          {orgId && user.role !== 'super' && <Bell unread={notices.filter(n => !n.read).length} label={t('Notifications')} />}
          <LangButton />
          <UserPill name={user.name} role={t(ROLE_NAMES[user.role])} />
        </header>
        <main>{children}</main>
      </div>
    </div>
  );
}

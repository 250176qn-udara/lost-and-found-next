import { Suspense, type ReactNode } from 'react';
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
import { TopSearch } from '@/components/TopSearch';
import { BagSticker, GlassesSticker, KeysSticker } from '@/components/StartArt';

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
        <div className="brand"><i></i><span>{t('Lost & Found')}</span></div>
        {org && <div className="org">{t(org.name)}</div>}
        {/* Nav reads the query string (to highlight /report vs /report?kind=found), so Next asks for a Suspense boundary. */}
        <Suspense fallback={null}><Nav role={user.role} /></Suspense>
        {/* A few item stickers from the start screen at the bottom of the menu. Decorative only. */}
        <div className="side-stickers" aria-hidden="true"><GlassesSticker /><BagSticker /><KeysSticker /></div>
      </aside>
      <div className="mainwrap">
        <header className="topbar">
          {orgId && user.role !== 'super' && (user.role === 'member'
            ? <TopSearch action="/browse" placeholder={t('Search found items')} />
            : <TopSearch action="/items" placeholder={t('Search items')} />)}
          <span className="grow" />
          {orgId && user.role !== 'super' && <Bell notices={notices.slice(0, 8)} unread={notices.filter(n => !n.read).length} />}
          <LangButton />
          <UserPill name={user.name} role={t(ROLE_NAMES[user.role])} />
        </header>
        <main>{children}</main>
      </div>
    </div>
  );
}

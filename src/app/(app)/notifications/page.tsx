import { requirePage } from '@/lib/auth';
import { NOTIFY_EVENTS } from '@/lib/constants';
import { getNotices } from '@/lib/data';
import { getT } from '@/lib/i18n-server';
import { getPrefs } from '@/lib/prefs';
import { Head } from '@/components/ui';
import { NoticeList, NotifySettings } from './NoticeList';

export default async function NotificationsPage() {
  const { user } = await requirePage({ roles: ['member', 'staff', 'admin'], membership: true });
  const staff = user.role !== 'member';
  const [t, notices, prefs] = await Promise.all([getT(), getNotices(user.id, user.role, user.organizationId!), getPrefs(user.id)]);
  return (
    <>
      <Head title={t('Notifications')} sub={t('Everything that needs your attention.')} />
      <NoticeList notices={notices} />
      <NotifySettings prefs={prefs.notify} events={NOTIFY_EVENTS.filter(e => staff ? e.staff : e.member)} email={user.email} />
    </>
  );
}

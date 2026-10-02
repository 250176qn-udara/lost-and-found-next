import { requirePage } from '@/lib/auth';
import { getMemberNotices, getStaffNotices } from '@/lib/data';
import { getT } from '@/lib/i18n-server';
import { Head } from '@/components/ui';
import { NoticeList } from './NoticeList';

export default async function NotificationsPage() {
  const { user } = await requirePage({ roles: ['member', 'staff', 'admin'], membership: true });
  const orgId = user.organizationId!;
  const [t, notices] = await Promise.all([
    getT(),
    user.role === 'member' ? getMemberNotices(user.id, orgId) : getStaffNotices(orgId),
  ]);
  return (
    <>
      <Head title={t('Notifications')} sub={t('Everything that needs your attention.')} />
      <NoticeList notices={notices} storageKey={`lf-read-${user.id}`} />
    </>
  );
}

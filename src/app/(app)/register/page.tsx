import { requirePage } from '@/lib/auth';
import { getQueue } from '@/lib/data';
import { getT } from '@/lib/i18n-server';
import { pickTab, Tabs, type TabDef } from '@/components/Tabs';
import { Head } from '@/components/ui';
import { RegisterForm } from './RegisterForm';
import { ScanPanel } from './ScanPanel';

/**
 * Intake: register an item someone brings to the office (?receive=ID for an item a member already posted),
 * or look an item up by its code.
 */
export default async function IntakePage({ searchParams }: { searchParams: Promise<{ receive?: string; tab?: string }> }) {
  const { user } = await requirePage({ roles: ['staff', 'admin'] });
  const [{ receive, tab }, t] = await Promise.all([searchParams, getT()]);
  const queued = receive ? (await getQueue(user.organizationId!)).find(i => i.id === Number(receive)) ?? null : null;
  const tabs: TabDef[] = [{ key: 'register', label: 'Register an item', icon: 'inbox' }, { key: 'lookup', label: 'Look up by code', icon: 'scan' }];
  const cur = queued ? 'register' : pickTab(tabs, tab);

  return (
    <>
      <Head title={t('Intake')} sub={t('Register items people bring to the office, or look one up by its code.')} />
      <Tabs tabs={tabs} current={cur} base="/register" t={t} />
      {/* key: start with a fresh form when switching between "receive" and "new item". */}
      {cur === 'register' ? <RegisterForm key={queued?.id ?? 'new'} queued={queued} afterPath="/desk" /> : <ScanPanel />}
    </>
  );
}

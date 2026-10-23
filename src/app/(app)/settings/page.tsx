import { requirePage } from '@/lib/auth';
import { getPlaces } from '@/lib/data';
import { getOrgSettings } from '@/lib/settings';
import { SettingsForm } from './SettingsForm';

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { user } = await requirePage({ roles: ['admin'] });
  const orgId = user.organizationId!;
  const [{ tab }, places, settings] = await Promise.all([searchParams, getPlaces(orgId), getOrgSettings(orgId)]);
  return <SettingsForm places={places} settings={settings} initialTab={tab === 'places' ? 'Places & shelves' : undefined} />;
}

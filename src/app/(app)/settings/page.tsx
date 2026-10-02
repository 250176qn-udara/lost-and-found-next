import { requirePage } from '@/lib/auth';
import { getPlaces } from '@/lib/data';
import { SettingsForm } from './SettingsForm';

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { user } = await requirePage({ roles: ['admin'] });
  const [{ tab }, places] = await Promise.all([searchParams, getPlaces(user.organizationId!)]);
  return <SettingsForm places={places} initialTab={tab === 'places' ? 'Places & shelves' : undefined} />;
}

import { requirePage } from '@/lib/auth';
import { SettingsForm } from './SettingsForm';

export default async function SettingsPage() {
  await requirePage({ roles: ['admin'] });
  return <SettingsForm />;
}

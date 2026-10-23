import { requirePage, startPath } from '@/lib/auth';
import { getPlaces } from '@/lib/data';
import { getOrgSettings } from '@/lib/settings';
import { geminiReady } from '@/lib/gemini';
import { ReportForm } from './ReportForm';

/** /report?kind=found opens the wizard with "I found something" selected. */
export default async function ReportPage({ searchParams }: { searchParams: Promise<{ kind?: string }> }) {
  const { user } = await requirePage({ membership: true });
  const [{ kind }, places, { categories }] = await Promise.all([searchParams, getPlaces(user.organizationId!), getOrgSettings(user.organizationId!)]);
  return (
    <ReportForm key={kind ?? 'lost'} initialKind={kind === 'found' ? 'found' : 'lost'}
      places={places} categories={categories} ai={geminiReady()} isMember={user.role === 'member'} afterPath={user.role === 'member' ? '/my-items' : startPath(user)} />
  );
}

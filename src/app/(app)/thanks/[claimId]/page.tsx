import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requirePage } from '@/lib/auth';
import { one } from '@/lib/db';
import { getT } from '@/lib/i18n-server';
import { giftProviderReady } from '@/lib/gift-provider';
import { payjpConfigured } from '@/lib/payjp';
import { Callout, Head } from '@/components/ui';
import { ThanksForm } from './ThanksForm';

/** The owner thanks the person who found their item (after it was returned). */
export default async function ThanksPage({ params }: { params: Promise<{ claimId: string }> }) {
  const { user } = await requirePage({ roles: ['member'], membership: true });
  const { claimId } = await params;
  const c = await one<{ id: number; status: string; claimant_id: number; finder: number; title: string; thanked: number | null }>(
    `SELECT c.id, c.status, c.claimant_id, i.reporter_id AS finder, i.title, t.id AS thanked
     FROM claims c JOIN items i ON i.id = c.found_item_id LEFT JOIN thanks t ON t.claim_id = c.id WHERE c.id = ?`, [Number(claimId) || 0]);
  if (!c || c.claimant_id !== user.id || c.finder === user.id) notFound();
  const t = await getT();

  return (
    <>
      <Head title={t('Say thank you')} sub={t('A letter to the person who found your {item}. Gifts are optional.', { item: c.title })} />
      {c.status !== 'returned' ? <Callout>{t('You can send thanks after you got the item back.')}</Callout>
        : c.thanked ? <Callout kind="teal">{t('You already sent thanks for this item.')} <Link href="/my-items?tab=thanks">{t('See it')}</Link></Callout>
        : <ThanksForm claimId={c.id} itemTitle={c.title} userName={user.name} userEmail={user.email} giftsOn={payjpConfigured() && giftProviderReady()} />}
    </>
  );
}

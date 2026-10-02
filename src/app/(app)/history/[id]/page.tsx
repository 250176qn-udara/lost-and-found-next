import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requirePage } from '@/lib/auth';
import { getMyReturns } from '@/lib/data';
import { getT } from '@/lib/i18n-server';
import { PrintButton } from '@/components/ClientBits';
import { Kv } from '@/components/ui';

/** Printable proof that an item was returned to the member. */
export default async function CertificatePage({ params }: { params: Promise<{ id: string }> }) {
  const { user } = await requirePage({ roles: ['member'], membership: true });
  const { id } = await params;
  const [t, [r]] = await Promise.all([getT(), getMyReturns(user.id, Number(id) || -1)]);
  if (!r) notFound();

  return (
    <>
      <div className="cert">
        <div className="meta">{t(r.orgName)} · {t('Lost & Found')}</div>
        <h1 style={{ margin: '10px 0 6px' }}>{t('Certificate of return')}</h1>
        <p className="meta">{t('This confirms that the item below was returned to its owner at the office.')}</p>
        <div style={{ maxWidth: 360, margin: '20px auto', textAlign: 'left' }}>
          <Kv label={t('Owner')} value={r.ownerName} />
          <Kv label={t('Item')} value={r.title} />
          <Kv label={t('Item code')} value={r.itemCode ?? '—'} />
          <Kv label={t('Found at')} value={t(r.place)} />
          <Kv label={t('Claim sent')} value={r.claimedAt.slice(0, 10)} />
          <Kv label={t('Returned')} value={r.returnedAt.slice(0, 16)} />
          <Kv label={t('ID checked')} value={r.idType ? t(r.idType) : '—'} />
        </div>
      </div>
      <div className="btnrow" style={{ justifyContent: 'center' }}>
        <PrintButton />
        <Link className="btn sec" href="/my-items?tab=claims">{t('Back')}</Link>
      </div>
    </>
  );
}

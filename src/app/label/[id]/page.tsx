import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requirePage } from '@/lib/auth';
import { getItemDetail } from '@/lib/data';
import { getT } from '@/lib/i18n-server';
import { PrintButton } from '@/components/ClientBits';
import { QrCode } from '@/components/QrCode';

/** A label to stick on a found item at the office. Staff scan its QR code under Intake → Look up by code. */
export default async function LabelPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ then?: string }> }) {
  const { user } = await requirePage({ roles: ['staff', 'admin'] });
  const [{ id }, { then }, t] = await Promise.all([params, searchParams, getT()]);
  const it = await getItemDetail(Number(id) || 0, user.organizationId!);
  if (!it || !it.itemCode) notFound();
  const back = then?.startsWith('/') && !then.startsWith('//') ? then : `/items/${it.id}`;

  return (
    <main style={{ maxWidth: 520, margin: '24px auto', padding: '0 16px' }}>
      <div className="label">
        <QrCode text={it.itemCode} size={150} />
        <div>
          <div className="code" style={{ fontSize: 20 }}>{it.itemCode}</div>
          <b style={{ display: 'block', marginTop: 4 }}>{it.title}</b>
          <div className="meta">{t(it.category)}</div>
          <div className="meta">{t('Shelf')}: <b>{it.shelf ?? '—'}</b></div>
          <div className="meta">{t('Received')}: {it.receivedAt?.slice(0, 10) ?? '—'}</div>
        </div>
      </div>
      <p className="meta noprint">{t('Stick this label on the item or its bag. Scan it under Intake → Look up by code.')}</p>
      <div className="btnrow noprint">
        <PrintButton label="Print label" />
        <Link className="btn sec" href={back}>{t('Done')}</Link>
      </div>
    </main>
  );
}

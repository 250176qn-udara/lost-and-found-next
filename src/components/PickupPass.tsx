// The owner's pickup pass: item code, 6-digit pickup code, shelf, valid-until. No hooks.
import type { T } from '@/lib/i18n';
import { QrCode } from './QrCode';
import { Kv } from './ui';

/** Days a pickup pass stays valid after the claim is approved. */
export const PASS_DAYS = 7;

export function validUntil(approvedAt: string | null | undefined) {
  if (!approvedAt) return null;
  const d = new Date(approvedAt.replace(' ', 'T'));
  d.setDate(d.getDate() + PASS_DAYS);
  return d.toISOString().slice(0, 10);
}

export function PickupPass({ t, title, itemCode, pickupCode, shelf, approvedAt, atOffice }: {
  t: T; title: string; itemCode: string | null; pickupCode: string | null | undefined; shelf: string | null | undefined;
  approvedAt: string | null | undefined; atOffice: boolean;
}) {
  return (
    <div className="cols even" style={{ alignItems: 'center' }}>
      <div className="pass">
        <div className="meta">{t('Pickup pass')}</div>
        <b style={{ display: 'block', fontSize: 16, marginTop: 4 }}>{title}</b>
        {pickupCode && (
          <>
            <div className="pin" aria-label={t('Pickup code')}>{pickupCode}</div>
            <div className="meta">{t('Tell this pickup code to staff')}</div>
          </>
        )}
        <QrCode text={itemCode ?? title} size={110} />
        <div className="code">{itemCode ?? '—'}</div>
        <div style={{ maxWidth: 240, margin: '8px auto 0', textAlign: 'left' }}>
          <Kv label={t('Shelf')} value={atOffice ? shelf ?? '—' : t('Not at the office yet')} />
          <Kv label={t('Valid until')} value={validUntil(approvedAt) ?? '—'} />
        </div>
      </div>
      <ol className="steplist">
        <li><div><b>{t('Go to the office')}</b><div className="meta">{t('Open hours are shown at the front desk.')}</div></div></li>
        <li><div><b>{t('Show your photo ID and tell the pickup code')}</b><div className="meta">{t('Staff check both before they hand over the item.')}</div></div></li>
        <li><div><b>{t('Take your item home')}</b><div className="meta">{t('The return is recorded in your history.')}</div></div></li>
      </ol>
    </div>
  );
}

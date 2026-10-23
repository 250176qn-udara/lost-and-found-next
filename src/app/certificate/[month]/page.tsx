import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requirePage } from '@/lib/auth';
import { one } from '@/lib/db';
import { getT } from '@/lib/i18n-server';
import { helperOfMonth } from '@/lib/community';
import { PrintButton } from '@/components/ClientBits';
import { Illustration } from '@/components/Illustration';

/** Printable "Helper of the month" certificate (感謝状) the school can hand over. */
export default async function CertificatePage({ params }: { params: Promise<{ month: string }> }) {
  const { user } = await requirePage({ membership: true });
  const { month } = await params;
  const orgId = user.organizationId!;
  const [t, helper, org] = await Promise.all([getT(), helperOfMonth(orgId, month), one<{ name: string }>('SELECT name FROM organizations WHERE id = ?', [orgId])]);
  if (!helper || !org) notFound();
  const [y, m] = month.split('-').map(Number);
  const today = new Date().toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Asia/Tokyo' });

  return (
    <main style={{ maxWidth: 820, margin: '24px auto', padding: '0 16px' }}>
      <div className="cert">
        <div className="cert-inner">
          <span className="cert-kicker">Lost &amp; Found · {t(org.name)}</span>
          <h1>感謝状 <small>Certificate of Thanks</small></h1>
          <div className="cert-medal" aria-hidden="true">🏅</div>
          <p className="cert-role">{y}年{m}月 お助けヘルパー賞 · Helper of the Month</p>
          <p className="cert-name">{helper.name} <span>殿</span></p>
          <p className="cert-text">
            あなたは {y}年{m}月、落とし物を持ち主のもとへ届ける活動に積極的に協力し、{helper.returns} 件の返却に貢献しました（{helper.total} ポイント）。
            その思いやりに心から感謝し、ここに表彰します。
          </p>
          <p className="cert-text en">
            In {new Date(y, m - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}, you helped {helper.returns} lost {helper.returns === 1 ? 'item' : 'items'} get back to {helper.returns === 1 ? 'its owner' : 'their owners'} ({helper.total} points).
            Thank you for your kindness.
          </p>
          <div className="cert-foot">
            <Illustration name="done" size={84} />
            <div className="cert-sign">
              <span>{today}</span>
              <span className="cert-line">{t(org.name)}</span>
              <span>落とし物係 · Lost &amp; Found Office</span>
            </div>
          </div>
        </div>
      </div>
      <div className="btnrow noprint">
        <PrintButton label="Print certificate" />
        <Link className="btn sec" href="/wall">{t('Back to the thank-you wall')}</Link>
      </div>
    </main>
  );
}

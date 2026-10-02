'use client';

import { useEffect, useState } from 'react';
import { markThanksRead } from '@/app/actions';
import { useT, useToast } from '@/components/Providers';

/** Marks the letter as read when shown, and keeps the gift code hidden until the finder asks for it. */
export function GiftReveal({ thanksId, unread, code, how }: { thanksId: number; unread: boolean; code: string | null; how: string }) {
  const t = useT();
  const toast = useToast();
  const [shown, setShown] = useState(false);
  useEffect(() => { if (unread) markThanksRead(thanksId).catch(() => {}); }, [thanksId, unread]);
  if (!code) return null;
  const isTest = code.startsWith('TEST-');
  return (
    <div className="giftbox">
      {shown ? (
        <>
          <div className="giftcode">{code}</div>
          <div className="btnrow" style={{ marginTop: 8, justifyContent: 'center' }}>
            <button className="btn sec" onClick={() => navigator.clipboard?.writeText(code).then(() => toast('Code copied'))}>{t('Copy code')}</button>
          </div>
          <p className="meta" style={{ margin: '8px 0 0' }}>{t(how)}</p>
          {isTest && <p className="meta" style={{ margin: '4px 0 0', color: 'var(--red)' }}>{t('Test gift: this code cannot be used in a shop.')}</p>}
        </>
      ) : <button className="btn" onClick={() => setShown(true)}>{t('Show gift code')}</button>}
    </div>
  );
}

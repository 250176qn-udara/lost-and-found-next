'use client';

import { useTransition } from 'react';
import { decideMembership } from '@/app/actions';
import { useT, useToast } from '@/components/Providers';

export function MembershipButtons({ id }: { id: number }) {
  const t = useT();
  const toast = useToast();
  const [busy, start] = useTransition();
  const decide = (action: 'approve' | 'reject') => start(async () => {
    const r = await decideMembership(id, action);
    toast(!r.ok ? r.error : action === 'approve' ? 'Membership approved' : 'Membership request rejected');
  });
  return (
    <>
      <button className="btn" disabled={busy} onClick={() => decide('approve')}>{t('Accept')}</button>{' '}
      <button className="btn bad" disabled={busy} onClick={() => decide('reject')}>{t('Reject')}</button>
    </>
  );
}

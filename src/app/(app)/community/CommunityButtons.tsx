'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { membershipStatus, requestMembership } from '@/app/actions';
import { useT, useToast } from '@/components/Providers';

export function RequestButton({ orgId, disabled }: { orgId: number; disabled: boolean }) {
  const t = useT();
  const toast = useToast();
  const [busy, start] = useTransition();
  return (
    <button className="btn" style={{ marginTop: 15 }} disabled={disabled || busy}
      onClick={() => start(async () => {
        const r = await requestMembership(orgId);
        toast(r.ok ? 'Membership request sent' : r.error);
      })}>
      {t('Request Membership')}
    </button>
  );
}

export function RefreshStatusButton() {
  const t = useT();
  const toast = useToast();
  const router = useRouter();
  const [busy, start] = useTransition();
  return (
    <button className="btn sec" disabled={busy}
      onClick={() => start(async () => {
        const r = await membershipStatus();
        if (!r.ok) return toast(r.error);
        if (r.approved) {
          toast('Membership approved');
          router.push('/home');
        } else {
          router.refresh();
        }
      })}>
      {t('Refresh Status')}
    </button>
  );
}

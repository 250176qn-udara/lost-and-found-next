'use client';

import { useT, useToast } from '@/components/Providers';

// MOCK: only shows a message for now.
export function AddOrganizationButton() {
  const t = useT();
  const toast = useToast();
  return <button className="btn" onClick={() => toast('Organization created')}>{t('Add organization')}</button>;
}

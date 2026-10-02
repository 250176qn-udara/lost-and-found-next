'use client';

import { useTransition } from 'react';
import { removeMember, setMemberRole } from '@/app/actions';
import { ROLE_NAMES } from '@/lib/constants';
import type { Role } from '@/lib/types';
import { useT, useToast } from '@/components/Providers';

const ROLES: Role[] = ['member', 'staff', 'admin'];

export function RoleSelect({ membershipId, role, disabled }: { membershipId: number; role: Role; disabled: boolean }) {
  const t = useT();
  const toast = useToast();
  const [busy, start] = useTransition();
  return (
    <select defaultValue={role} disabled={disabled || busy} onChange={e => {
      const next = e.target.value;
      start(async () => {
        const r = await setMemberRole(membershipId, next);
        toast(r.ok ? 'Role updated' : r.error);
      });
    }}>
      {ROLES.map(r => <option key={r} value={r}>{t(ROLE_NAMES[r])}</option>)}
    </select>
  );
}

export function RemoveButton({ membershipId, name }: { membershipId: number; name: string }) {
  const t = useT();
  const toast = useToast();
  const [busy, start] = useTransition();
  return (
    <button className="btn bad" disabled={busy} onClick={() => {
      if (!confirm(t('Remove {name} from this organization?', { name }))) return;
      start(async () => {
        const r = await removeMember(membershipId);
        toast(r.ok ? 'Access removed' : r.error);
      });
    }}>{t('Remove access')}</button>
  );
}

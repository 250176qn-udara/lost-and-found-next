import 'server-only';
import { cache } from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getIronSession } from 'iron-session';
import { one } from './db';
import { isExpired, sessionOptions, type SessionData } from './session';
import type { Me, MembershipStatus, Role, User } from './types';

/** An error whose message is safe to show to the user (like fail() in the PHP API). */
export class ActionError extends Error {}

export async function getSession() {
  return getIronSession<SessionData>(await cookies(), sessionOptions);
}

/** Current user + their membership state, in the shape the pages expect. */
export async function loadState(uid: number): Promise<Me | null> {
  const u = await one<{ id: number; name: string; email: string }>('SELECT id, name, email FROM users WHERE id = ?', [uid]);
  if (!u) return null;
  const m = await one<{ organization_id: number; role: Role }>(
    `SELECT organization_id, role FROM organization_members
     WHERE user_id = ? AND status = 'approved'
     ORDER BY approved_at DESC, id DESC LIMIT 1`, [uid]);
  const p = await one<{ id: number; organization_id: number }>(
    `SELECT id, organization_id FROM organization_members
     WHERE user_id = ? AND status = 'pending' ORDER BY id DESC LIMIT 1`, [uid]);
  let last: { status: MembershipStatus } | null = null;
  if (!m && !p) {
    last = await one('SELECT status FROM organization_members WHERE user_id = ? ORDER BY id DESC LIMIT 1', [uid]);
  }
  const user: User = {
    id: u.id,
    name: u.name,
    email: u.email,
    role: m ? m.role : 'member',
    organizationId: m ? m.organization_id : null,
    membershipStatus: m ? 'approved' : p ? 'pending' : (last?.status ?? null),
  };
  return { user, pending: p ? { id: p.id, organizationId: p.organization_id } : null };
}

/** The logged-in user for this request, or null. Cached per request. */
export const getMe = cache(async (): Promise<Me | null> => {
  const s = await getSession();
  if (!s.uid || isExpired(s)) return null;
  return loadState(s.uid);
});

/** First page after login, like startView() in app.js. */
export function startPath(u: User): string {
  if (u.role === 'admin') return '/dash';
  if (u.role === 'staff') return '/desk';
  if (u.role === 'super') return '/orgs';
  return u.membershipStatus === 'approved' ? '/home' : '/community';
}

/** Page guard (like go() in app.js): redirects instead of rendering a page the user may not see. */
export async function requirePage(opts: { roles?: Role[]; membership?: boolean } = {}): Promise<Me> {
  const me = await getMe();
  if (!me) redirect('/login');
  if (opts.membership && me.user.membershipStatus !== 'approved') redirect('/community');
  if (opts.roles && !opts.roles.includes(me.user.role)) redirect(startPath(me.user));
  return me;
}

// ---------- guards for Server Actions (throw ActionError, like fail() in PHP) ----------

export async function requireLogin(): Promise<Me> {
  const s = await getSession();
  if (s.uid && isExpired(s)) throw new ActionError('Your session expired. Please log in again.');
  const me = s.uid ? await loadState(s.uid) : null;
  if (!me) throw new ActionError('Please log in.');
  return me;
}

export async function requireMember(msg = 'Join a community first.') {
  const me = await requireLogin();
  const { user } = me;
  if (user.membershipStatus !== 'approved' || !user.organizationId) throw new ActionError(msg);
  return { uid: user.id, orgId: user.organizationId, me };
}

/** Staff and admins both work the front desk. */
export async function requireStaff() {
  const { user } = await requireLogin();
  if (!['staff', 'admin'].includes(user.role) || !user.organizationId) throw new ActionError('Staff only.');
  return { uid: user.id, orgId: user.organizationId };
}

export async function requireAdmin() {
  const { user } = await requireLogin();
  if (user.role !== 'admin' || !user.organizationId) throw new ActionError('Administrators only.');
  return { uid: user.id, orgId: user.organizationId };
}

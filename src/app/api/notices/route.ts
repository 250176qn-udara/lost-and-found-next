import { NextResponse } from 'next/server';
import { getMe } from '@/lib/auth';
import { getNotices } from '@/lib/data';

/** For the top-bar bell's background check: the unread count and the 8 newest notifications.
 *  Polling this does not count as activity, so the 30-minute logout still happens (see proxy.ts). */
export async function GET() {
  const headers = { 'Cache-Control': 'no-store' };
  try {
    const me = await getMe();
    if (!me) return NextResponse.json({ error: 'logged out' }, { status: 401, headers });
    const { id, role, organizationId } = me.user;
    if (!organizationId || role === 'super' || me.user.membershipStatus !== 'approved') return NextResponse.json({ count: 0, notices: [] }, { headers });
    const notices = await getNotices(id, role, organizationId);
    return NextResponse.json({ count: notices.filter(n => !n.read).length, notices: notices.slice(0, 8) }, { headers });
  } catch {
    return NextResponse.json({ error: 'server error' }, { status: 500, headers });
  }
}

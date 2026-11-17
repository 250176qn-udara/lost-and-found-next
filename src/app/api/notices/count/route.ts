import { NextResponse } from 'next/server';
import { getMe } from '@/lib/auth';
import { getNotices } from '@/lib/data';

/** Lightweight endpoint: returns unread notification count. Used by the bell for polling. */
export async function GET() {
  try {
    const me = await getMe();
    if (!me || !me.user.organizationId || me.user.role === 'super') return NextResponse.json({ count: 0 });
    const notices = await getNotices(me.user.id, me.user.role, me.user.organizationId);
    const count = notices.filter(n => !n.read).length;
    return NextResponse.json({ count }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json({ count: 0 });
  }
}

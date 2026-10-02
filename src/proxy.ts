import { NextResponse, type NextRequest } from 'next/server';
import { getIronSession } from 'iron-session';
import { isExpired, now, sessionOptions, type SessionData } from '@/lib/session';

/**
 * Sliding session: every request by a logged-in user pushes the 30-minute timeout forward.
 * An expired session is cleared; page visits are sent to the login page with a notice.
 */
export async function proxy(req: NextRequest) {
  const res = NextResponse.next();
  const session = await getIronSession<SessionData>(req, res, sessionOptions);
  if (!session.uid) return res;

  if (isExpired(session)) {
    if (req.method !== 'GET' || req.nextUrl.pathname === '/login') {
      session.destroy(); // Server Actions then answer "Your session expired" themselves
      return res;
    }
    const to = NextResponse.redirect(new URL('/login?expired=1', req.url));
    (await getIronSession<SessionData>(req, to, sessionOptions)).destroy();
    return to;
  }

  session.lastActivity = now();
  await session.save();
  return res;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};

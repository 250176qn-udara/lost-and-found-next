import type { SessionOptions } from 'iron-session';

export type SessionData = { uid?: number; lastActivity?: number };

/** Inactive sessions expire after 30 minutes (same as the PHP version). */
export const SESSION_TIMEOUT = 1800;

const password = process.env.SESSION_SECRET ?? '';
if (password.length < 32) {
  throw new Error('SESSION_SECRET must be at least 32 characters. Copy .env.example to .env.local and set it.');
}

export const sessionOptions: SessionOptions = {
  cookieName: 'lfsid',
  password,
  cookieOptions: {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: undefined, // browser-session cookie, like session_set_cookie_params(lifetime 0)
  },
};

export const now = () => Math.floor(Date.now() / 1000);

export function isExpired(s: SessionData): boolean {
  return !!s.uid && !!s.lastActivity && now() - s.lastActivity > SESSION_TIMEOUT;
}

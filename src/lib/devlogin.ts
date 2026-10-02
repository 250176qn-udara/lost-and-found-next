import 'server-only';

/**
 * Development shortcut: log in with just a name (or email), no password.
 * On only when DEV_LOGIN=1 (set in .env.development.local) AND the app runs with `npm run dev`.
 * It can never be on in a production build. Remove that file to turn it off.
 */
export const DEV_LOGIN = process.env.NODE_ENV !== 'production' && process.env.DEV_LOGIN === '1';

/** Password given to accounts created while DEV_LOGIN is on, so they still work after it is turned off. */
export const DEV_DEFAULT_PASSWORD = '123456';

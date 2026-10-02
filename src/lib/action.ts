import 'server-only';
import { ActionError } from './auth';

export type Result<T extends object = object> = ({ ok: true } & T) | { ok: false; error: string };

/** Wraps a Server Action body: known errors go back to the form, anything else is logged. */
export async function handle<T extends object>(fn: () => Promise<T>): Promise<Result<T>> {
  try {
    return { ok: true, ...(await fn()) };
  } catch (e) {
    if (e instanceof ActionError) return { ok: false, error: e.message };
    console.error(e);
    return { ok: false, error: 'Server error. Please try again.' };
  }
}

// ---------- input helpers (same rules as the PHP API) ----------

export const str = (fd: FormData, k: string) => String(fd.get(k) ?? '').trim();

/** Length in characters, not bytes (like preg_match with /u). */
const len = (s: string) => [...s].length;

export function maxLen(v: string, max: number, msg: string) {
  if (len(v) > max) throw new ActionError(msg);
}

/** '' -> null, otherwise must be a real YYYY-MM-DD date. */
export function parseDate(v: string): string | null {
  if (v === '') return null;
  const d = new Date(v + 'T00:00:00Z');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v) || isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== v) {
    throw new ActionError('Please enter a valid date.');
  }
  return v;
}

/** Turns an uploaded file into the data: URL stored in items.photo, or null when no file was chosen. */
export async function parsePhoto(v: FormDataEntryValue | null): Promise<string | null> {
  if (!v || typeof v === 'string' || v.size === 0) return null;
  if (!/^image\/(png|jpe?g|webp|gif)$/.test(v.type)) throw new ActionError('Photo must be an image.');
  const url = `data:${v.type};base64,${Buffer.from(await v.arrayBuffer()).toString('base64')}`;
  if (url.length > 2_000_000) throw new ActionError('Photo is too large. Please use a smaller image.');
  return url;
}

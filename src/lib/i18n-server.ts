import 'server-only';
import { cookies } from 'next/headers';
import { makeT } from './i18n';
import type { Lang } from './types';

export async function getLang(): Promise<Lang> {
  return (await cookies()).get('lf-lang')?.value === 'ja' ? 'ja' : 'en';
}

/** Translator for Server Components. */
export async function getT() {
  return makeT(await getLang());
}

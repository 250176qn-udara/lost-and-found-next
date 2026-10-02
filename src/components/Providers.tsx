'use client';

import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';
import { makeT, type T } from '@/lib/i18n';
import type { Lang } from '@/lib/types';

type Ctx = { lang: Lang; t: T; toast: (msg: string) => void };
const AppContext = createContext<Ctx | null>(null);

function useApp() {
  const c = useContext(AppContext);
  if (!c) throw new Error('useApp must be used inside <Providers>');
  return c;
}
export const useT = () => useApp().t;
export const useLang = () => useApp().lang;
/** Shows a short message at the bottom of the screen. The message is translated. */
export const useToast = () => useApp().toast;

export function Providers({ lang, children }: { lang: Lang; children: ReactNode }) {
  const t = useMemo(() => makeT(lang), [lang]);
  const [msg, setMsg] = useState('');
  const [on, setOn] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const toast = useCallback((m: string) => {
    setMsg(m);
    setOn(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setOn(false), 2200);
  }, []);
  const value = useMemo(() => ({ lang, t, toast }), [lang, t, toast]);
  return (
    <AppContext.Provider value={value}>
      {children}
      <div className={'toast' + (on ? ' on' : '')} role="status" aria-live="polite">{t(msg)}</div>
    </AppContext.Provider>
  );
}

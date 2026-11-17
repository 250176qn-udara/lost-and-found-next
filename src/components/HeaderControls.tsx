'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState, useTransition } from 'react';
import type { Lang, Role } from '@/lib/types';
import { logout, setLang } from '@/app/actions';
import { POSITION, POSITION_ICON } from '@/lib/constants';
import { Icon } from './Icon';
import { useLang, useT } from './Providers';

/** The signed-in person's position (Admin / Staff / Member) with a matching icon, and the log-out button (top bar).
 *  Names are not shown here, only the position. */
export function UserPill({ role }: { role: Role }) {
  const t = useT();
  const router = useRouter();
  return (
    <div className="roles">
      <div className={'user pos-' + role}>
        <span className="avatar" aria-hidden="true"><Icon name={POSITION_ICON[role]} size={18} /></span>
        <span className="who"><b>{t(POSITION[role])}</b></span>
      </div>
      <button className="logout" onClick={async () => { await logout(); router.push('/login'); }}>{t('Log out')}</button>
    </div>
  );
}

/** Languages the app offers: code, name in its own language, name in English. Add a line here to offer another one. */
const LANGUAGES: { code: Lang; native: string; english: string }[] = [
  { code: 'en', native: 'English', english: 'English' },
  { code: 'ja', native: '日本語', english: 'Japanese' },
];

/** Language picker: shows the current language; click to open the list of all languages and choose one. */
export function LangButton() {
  const lang = useLang();
  const t = useT();
  const [pending, start] = useTransition();
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const items = useRef<(HTMLButtonElement | null)[]>([]);
  const current = LANGUAGES.find(l => l.code === lang) ?? LANGUAGES[0];

  // Close on a click outside or Escape; focus the current language when the list opens.
  useEffect(() => {
    if (!open) return;
    items.current[LANGUAGES.findIndex(l => l.code === lang)]?.focus();
    const onDown = (e: MouseEvent) => { if (!box.current?.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { setOpen(false); box.current?.querySelector<HTMLButtonElement>('.lang')?.focus(); } };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
  }, [open, lang]);

  const choose = (code: Lang) => {
    setOpen(false);
    if (code !== lang) start(() => setLang(code));
  };
  // Up/Down move between languages inside the open list.
  const move = (e: React.KeyboardEvent, i: number) => {
    const n = LANGUAGES.length;
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      items.current[(i + (e.key === 'ArrowDown' ? 1 : n - 1)) % n]?.focus();
    }
  };

  return (
    <div className="langpick" ref={box}>
      <button type="button" className={'lang' + (open ? ' open' : '')} title={t('Language / 言語')} aria-label={t('Change language')}
        aria-haspopup="menu" aria-expanded={open} disabled={pending} onClick={() => setOpen(o => !o)}>
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18" />
        </svg>
        <span className="lang-cur" lang={current.code}>{current.native}</span>
        <svg className="lang-chev" viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="m4 6 4 4 4-4" />
        </svg>
      </button>
      {open && (
        <div className="langmenu" role="menu" aria-label={t('Language / 言語')}>
          <div className="langmenu-head">{t('Choose a language')}</div>
          {LANGUAGES.map((l, i) => (
            <button key={l.code} type="button" role="menuitemradio" aria-checked={l.code === lang} lang={l.code}
              ref={el => { items.current[i] = el; }} className={l.code === lang ? 'on' : ''}
              onClick={() => choose(l.code)} onKeyDown={e => move(e, i)}>
              <span className="langmenu-code">{l.code.toUpperCase()}</span>
              <span className="langmenu-name"><b>{l.native}</b>{l.native !== l.english && <small>{l.english}</small>}</span>
              {l.code === lang && <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5" /></svg>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

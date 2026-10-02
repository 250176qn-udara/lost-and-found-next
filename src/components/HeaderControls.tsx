'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { logout, setLang } from '@/app/actions';
import { useLang, useT } from './Providers';

/** Initials avatar, name and role, and the log-out button (top bar). */
export function UserPill({ name, role }: { name: string; role: string }) {
  const t = useT();
  const router = useRouter();
  const initials = name.replace(/^(Mr|Mrs|Ms|Dr)\.?\s+/i, '').split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase();
  return (
    <div className="roles">
      <div className="user">
        <span className="avatar" aria-hidden="true">{initials}</span>
        <span className="who"><b>{name}</b><span>{role}</span></span>
      </div>
      <button className="logout" onClick={async () => { await logout(); router.push('/login'); }}>{t('Log out')}</button>
    </div>
  );
}

export function LangButton() {
  const lang = useLang();
  const t = useT();
  const [, start] = useTransition();
  return (
    <button className="lang" title={t('Language / 言語')} aria-label={t('Change language')}
      onClick={() => start(() => setLang(lang === 'en' ? 'ja' : 'en'))}>
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18" />
      </svg>
      <span className={lang === 'en' ? 'on' : ''}>EN</span>
      <span className={lang === 'ja' ? 'on' : ''}>日本語</span>
    </button>
  );
}

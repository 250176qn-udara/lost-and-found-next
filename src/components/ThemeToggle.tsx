'use client';

import { useEffect, useState } from 'react';
import { useT } from './Providers';

type Theme = 'light' | 'dark';

/** Light / dark switch in the top bar. The choice is saved in this browser; without one, the device setting is used
 *  (see THEME_INIT in lib/theme.ts, which applies it before the page is painted). */
export function ThemeToggle() {
  const t = useT();
  // null until mounted: the server cannot know the theme, so both renders start the same.
  const [theme, setTheme] = useState<Theme | null>(null);

  useEffect(() => {
    setTheme(document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light');
  }, []);

  const toggle = () => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
    try { localStorage.setItem('theme', next); } catch { /* private mode: works until reload */ }
  };

  const dark = theme === 'dark';
  const label = t(dark ? 'Switch to light mode' : 'Switch to dark mode');
  return (
    <button type="button" className="theme-btn" onClick={toggle} title={label} aria-label={label} aria-pressed={dark}>
      {dark ? (
        <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      )}
    </button>
  );
}

import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Inter, Noto_Sans_JP, Plus_Jakarta_Sans } from 'next/font/google';
import { getMe } from '@/lib/auth';
import { getLang } from '@/lib/i18n-server';
import { makeT } from '@/lib/i18n';
import { Providers } from '@/components/Providers';
import { LangButton } from '@/components/HeaderControls';
import './globals.css';

// Clean UI faces: Inter for Latin text, Noto Sans JP for Japanese (both variable fonts).
const ui = Inter({ subsets: ['latin'], variable: '--font-ui' });
const jp = Noto_Sans_JP({ subsets: ['latin'], variable: '--font-jp', preload: false });
// Display face for the "Lost & Found" logo text.
const display = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['700', '800'], variable: '--font-display' });

export const metadata: Metadata = {
  title: 'Lost & Found',
  description: 'Report and find lost items in your community',
  manifest: '/manifest.json',
  themeColor: '#4F46E5',
  appleWebApp: { capable: true, statusBarStyle: 'default', title: 'Lost & Found' },
  viewport: { width: 'device-width', initialScale: 1, maximumScale: 1 },
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const lang = await getLang();
  const t = makeT(lang);
  // Logged-in pages get the sidebar and top bar from (app)/layout.tsx; login and sign-up get this simple bar.
  // It must still render when the database is down.
  const me = await getMe().catch(() => null);

  return (
    <html lang={lang} className={`${ui.variable} ${jp.variable} ${display.variable}`}>
      {/* Inline script: applies saved theme before first paint so there is no flash */}
      <head>
        <script dangerouslySetInnerHTML={{ __html: `(function(){try{var t=localStorage.getItem('theme');if(t)document.documentElement.setAttribute('data-theme',t);}catch(e){}})()` }} />
      </head>
      <body>
        <Providers lang={lang}>
          {!me && (
            <header className="pubbar">
              <div className="brand"><i></i><span>{t('Lost & Found')}</span></div>
              <LangButton />
            </header>
          )}
          {children}
        </Providers>
      </body>
    </html>
  );
}

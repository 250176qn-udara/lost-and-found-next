import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { Inter, Noto_Sans_JP, Plus_Jakarta_Sans } from 'next/font/google';
import { getMe } from '@/lib/auth';
import { getLang } from '@/lib/i18n-server';
import { makeT } from '@/lib/i18n';
import { Providers } from '@/components/Providers';
import { LangButton } from '@/components/HeaderControls';
import { ThemeToggle } from '@/components/ThemeToggle';
import { THEME_INIT } from '@/lib/theme';
import './globals.css';
import { BrandMark } from '@/components/BrandMark';

// Clean UI faces: Inter for Latin text, Noto Sans JP for Japanese (both variable fonts).
const ui = Inter({ subsets: ['latin'], variable: '--font-ui' });
const jp = Noto_Sans_JP({ subsets: ['latin'], variable: '--font-jp', preload: false });
// Display face for the "Lost & Found" logo text.
const display = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['700', '800'], variable: '--font-display' });

export const metadata: Metadata = {
  title: 'Lost & Found',
  description: 'Report and find lost items in your community',
  manifest: '/manifest.json',
  icons: { icon: '/icon.svg', apple: '/icon.svg' },
  appleWebApp: { capable: true, statusBarStyle: 'default', title: 'Lost & Found' },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [{ media: '(prefers-color-scheme: light)', color: '#4F46E5' }, { media: '(prefers-color-scheme: dark)', color: '#0B1120' }],
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const lang = await getLang();
  const t = makeT(lang);
  // Logged-in pages get the sidebar and top bar from (app)/layout.tsx; login and sign-up get this simple bar.
  // It must still render when the database is down.
  const me = await getMe().catch(() => null);

  return (
    // The theme script sets data-theme on <html> before the first paint (no flash), so React must not complain about it.
    <html lang={lang} className={`${ui.variable} ${jp.variable} ${display.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT }} />
      </head>
      <body>
        <Providers lang={lang}>
          {!me && (
            <header className="pubbar">
              <div className="brand"><BrandMark /><span>{t('Lost & Found')}</span></div>
              <span className="pubbar-tools"><ThemeToggle /><LangButton /></span>
            </header>
          )}
          {children}
        </Providers>
      </body>
    </html>
  );
}

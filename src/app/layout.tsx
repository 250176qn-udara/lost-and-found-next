import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Inter, Noto_Sans_JP } from 'next/font/google';
import { getMe } from '@/lib/auth';
import { getLang } from '@/lib/i18n-server';
import { makeT } from '@/lib/i18n';
import { Providers } from '@/components/Providers';
import { LangButton } from '@/components/HeaderControls';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const jp = Noto_Sans_JP({ weight: ['400', '500', '600', '700'], subsets: ['latin'], variable: '--font-jp', preload: false });

export const metadata: Metadata = { title: 'Lost & Found' };

export default async function RootLayout({ children }: { children: ReactNode }) {
  const lang = await getLang();
  const t = makeT(lang);
  // Logged-in pages get the sidebar and top bar from (app)/layout.tsx; login and sign-up get this simple bar.
  // It must still render when the database is down.
  const me = await getMe().catch(() => null);

  return (
    <html lang={lang} className={`${inter.variable} ${jp.variable}`}>
      <body>
        <Providers lang={lang}>
          {!me && (
            <header className="pubbar">
              <div className="brand"><i></i>{t('Lost & Found')}</div>
              <LangButton />
            </header>
          )}
          {children}
        </Providers>
      </body>
    </html>
  );
}

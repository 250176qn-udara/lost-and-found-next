import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { M_PLUS_Rounded_1c, Nunito } from 'next/font/google';
import { getMe } from '@/lib/auth';
import { getLang } from '@/lib/i18n-server';
import { makeT } from '@/lib/i18n';
import { Providers } from '@/components/Providers';
import { LangButton } from '@/components/HeaderControls';
import './globals.css';

// Friendly rounded faces: Nunito for Latin text, M PLUS Rounded 1c for Japanese.
const ui = Nunito({ subsets: ['latin'], weight: ['400', '600', '700', '800'], variable: '--font-ui' });
const jp = M_PLUS_Rounded_1c({ weight: ['400', '500', '700', '800'], subsets: ['latin'], variable: '--font-jp', preload: false });

export const metadata: Metadata = { title: 'Lost & Found' };

export default async function RootLayout({ children }: { children: ReactNode }) {
  const lang = await getLang();
  const t = makeT(lang);
  // Logged-in pages get the sidebar and top bar from (app)/layout.tsx; login and sign-up get this simple bar.
  // It must still render when the database is down.
  const me = await getMe().catch(() => null);

  return (
    <html lang={lang} className={`${ui.variable} ${jp.variable}`}>
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

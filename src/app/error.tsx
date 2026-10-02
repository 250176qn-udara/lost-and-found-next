'use client';

import { useT } from '@/components/Providers';

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  const t = useT();
  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>{t('Something went wrong')}</h1>
        <p className="sub">{t('If this keeps happening, check that MySQL is running and that .env.local is set up.')}</p>
        <button className="btn" onClick={reset}>{t('Try again')}</button>
      </div>
    </div>
  );
}

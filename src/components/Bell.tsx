'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Icon } from './Icon';
import { useT } from './Providers';

/** Top-bar bell with the number of unread notifications. Read state is kept in this browser (see NoticeList). */
export function Bell({ ids, storageKey }: { ids: string[]; storageKey: string }) {
  const t = useT();
  const [unread, setUnread] = useState(0);
  useEffect(() => {
    const count = () => {
      let read: string[] = [];
      try { read = JSON.parse(localStorage.getItem(storageKey) ?? '[]'); } catch { /* storage blocked */ }
      setUnread(ids.filter(i => !read.includes(i)).length);
    };
    count();
    window.addEventListener('lf-read', count);
    return () => window.removeEventListener('lf-read', count);
  }, [ids, storageKey]);
  return (
    <Link href="/notifications" className="bell" aria-label={t('Notifications')} title={t('Notifications')}>
      <Icon name="bell" size={20} />
      {unread > 0 && <span className="dotcount">{unread > 9 ? '9+' : unread}</span>}
    </Link>
  );
}

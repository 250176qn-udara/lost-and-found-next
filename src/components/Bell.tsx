'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { markNoticesRead } from '@/app/actions';
import type { Notice } from '@/lib/types';
import { Icon } from './Icon';
import { useT } from './Providers';
import { when } from './ui';

/** Top-bar bell: the unread count, and a drop-down with the newest notifications (new lost / found posts included).
 *  Clicking one marks it read and opens it. Read state is saved per user (notice_reads).
 *  Polls every 45 seconds so the count stays fresh without a page reload. */
export function Bell({ notices, unread: initialUnread }: { notices: Notice[]; unread: number }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [read, setRead] = useState(() => new Set(notices.filter(n => n.read).map(n => n.id)));
  const [liveUnread, setLiveUnread] = useState(initialUnread);
  const box = useRef<HTMLDivElement>(null);
  // New notices arrive with each page load; keep the read set in step with them.
  useEffect(() => { setRead(new Set(notices.filter(n => n.read).map(n => n.id))); }, [notices]);
  // Poll every 45s for new notifications count (lightweight: just the count, no full reload).
  useEffect(() => {
    const poll = async () => {
      try {
        const r = await fetch('/api/notices/count');
        if (r.ok) { const d = await r.json() as { count: number }; setLiveUnread(d.count); }
      } catch {}
    };
    const id = setInterval(poll, 45_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!open) return;
    const away = (e: MouseEvent) => { if (!box.current?.contains(e.target as Node)) setOpen(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', away);
    document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('mousedown', away); document.removeEventListener('keydown', esc); };
  }, [open]);

  const mark = (ids: string[]) => {
    const fresh = ids.filter(id => !read.has(id));
    if (!fresh.length) return;
    setRead(new Set([...read, ...fresh]));
    void markNoticesRead(fresh);
  };
  const left = Math.max(0, liveUnread - notices.filter(n => !n.read && read.has(n.id)).length);
  const label = t('Notifications');

  return (
    <div className="bellpick" ref={box}>
      <button type="button" className={'bell' + (open ? ' open' : '')} aria-label={label} title={label}
        aria-haspopup="true" aria-expanded={open} onClick={() => setOpen(o => !o)}>
        <Icon name="bell" size={20} />
        {left > 0 && <span className="dotcount">{left > 9 ? '9+' : left}</span>}
      </button>
      {open && (
        <div className="bellmenu" role="menu">
          <div className="bellmenu-head">
            <b>{label}</b>
            {left > 0 && <button type="button" className="linkbtn" onClick={() => mark(notices.map(n => n.id))}>{t('Mark all as read')}</button>}
          </div>
          {notices.length ? (
            <div className="bellmenu-list">
              {notices.map(n => {
                const post = n.id.startsWith('np') || /^q\d/.test(n.id);
                const lost = post && n.title.includes('lost');
                return (
                  <Link key={n.id} href={n.href} role="menuitem" className={'bellitem' + (read.has(n.id) ? '' : ' unread')}
                    onClick={() => { mark([n.id]); setOpen(false); }}>
                    <span className={'bellitem-ic ' + (post ? (lost ? 'lost' : 'found') : '')}>
                      <Icon name={post ? (lost ? 'search' : 'hand') : 'bell'} size={16} />
                    </span>
                    <span className="bellitem-body">
                      <b>{t(n.title)}</b>
                      <span className="meta">{n.text}</span>
                      <span className="bellitem-at">{when(n.at)}</span>
                    </span>
                    {!read.has(n.id) && <i className="bellitem-dot" aria-label={t('Unread')} />}
                  </Link>
                );
              })}
            </div>
          ) : <div className="bellmenu-empty meta">{t('No notifications.')}</div>}
          <Link href="/notifications" className="bellmenu-all" onClick={() => setOpen(false)}>
            {t('See all notifications')} <Icon name="chevron" size={14} />
          </Link>
        </div>
      )}
    </div>
  );
}

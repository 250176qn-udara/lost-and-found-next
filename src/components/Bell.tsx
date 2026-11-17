'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { markNoticesRead } from '@/app/actions';
import type { Notice } from '@/lib/types';
import { Icon } from './Icon';
import { useT } from './Providers';
import { when } from './ui';

const POLL_MS = 30_000;

/** Top-bar bell: the unread count, and a drop-down with the newest notifications (new lost / found posts included).
 *  Clicking one marks it read and opens it. Read state is saved per user (notice_reads).
 *  While the tab is visible it checks /api/notices every 30 s (and when you come back to the tab or open the bell),
 *  so both the count and the list stay current without reloading the page. */
export function Bell({ notices: initial, unread: initialUnread }: { notices: Notice[]; unread: number }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [notices, setNotices] = useState(initial);
  const [liveUnread, setLiveUnread] = useState(initialUnread);
  const [read, setRead] = useState(() => new Set(initial.filter(n => n.read).map(n => n.id)));
  const box = useRef<HTMLDivElement>(null);

  // Fresh data from the server (page navigation or a background check) replaces what we show.
  const apply = useCallback((list: Notice[], count: number) => {
    setNotices(list);
    setLiveUnread(count);
    setRead(new Set(list.filter(n => n.read).map(n => n.id)));
  }, []);
  useEffect(() => { apply(initial, initialUnread); }, [initial, initialUnread, apply]);

  const check = useCallback(async () => {
    try {
      const r = await fetch('/api/notices', { cache: 'no-store' });
      if (!r.ok) return; // logged out or server busy: keep what we have
      const d = await r.json() as { count: number; notices: Notice[] };
      apply(d.notices, d.count);
    } catch { /* offline: try again next time */ }
  }, [apply]);

  useEffect(() => {
    const tick = () => { if (document.visibilityState === 'visible') void check(); };
    const id = setInterval(tick, POLL_MS);
    document.addEventListener('visibilitychange', tick);
    return () => { clearInterval(id); document.removeEventListener('visibilitychange', tick); };
  }, [check]);

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
        aria-haspopup="true" aria-expanded={open} onClick={() => { if (!open) void check(); setOpen(o => !o); }}>
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

'use client';

import Link from 'next/link';
import { useState, useTransition } from 'react';
import { markNoticesRead, saveNotifyPrefs } from '@/app/actions';
import type { NOTIFY_EVENTS, NotifyEvent, NotifyPrefs } from '@/lib/constants';
import type { Notice } from '@/lib/types';
import { useT, useToast } from '@/components/Providers';
import { when } from '@/components/ui';

export function NoticeList({ notices }: { notices: Notice[] }) {
  const t = useT();
  const [read, setRead] = useState(() => new Set(notices.filter(n => n.read).map(n => n.id)));
  const [onlyUnread, setOnlyUnread] = useState(false);

  const mark = (ids: string[]) => {
    const fresh = ids.filter(id => !read.has(id));
    if (!fresh.length) return;
    setRead(new Set([...read, ...fresh]));
    void markNoticesRead(fresh); // the bell updates when the page refreshes
  };
  const list = notices.filter(n => !onlyUnread || !read.has(n.id));
  const unread = notices.filter(n => !read.has(n.id)).length;

  return (
    <>
      <div className="seg tabrow">
        <button className={onlyUnread ? '' : 'on'} onClick={() => setOnlyUnread(false)}>{t('All')}</button>
        <button className={onlyUnread ? 'on' : ''} onClick={() => setOnlyUnread(true)}>{t('Unread')}{unread > 0 && ` (${unread})`}</button>
      </div>
      {list.length ? list.map(n => (
        <Link key={n.id} href={n.href} onClick={() => mark([n.id])} style={{ color: 'inherit', textDecoration: 'none' }}>
          <div className="tag">
            <div className="row">
              <div><span className={'dot' + (read.has(n.id) ? ' off' : '')} /><b>{t(n.title)}</b><div className="meta">{n.text}</div></div>
              <span className="meta">{when(n.at)}</span>
            </div>
          </div>
        </Link>
      )) : <div className="box meta">{t(onlyUnread ? 'No unread notifications.' : 'No notifications.')}</div>}
      {unread > 0 && <div className="btnrow"><button className="btn sec" onClick={() => mark(notices.map(n => n.id))}>{t('Mark all as read')}</button></div>}
    </>
  );
}

/** Per kind: show in the app, send by email. Saved for this user. */
export function NotifySettings({ prefs, events, email }: { prefs: NotifyPrefs; events: typeof NOTIFY_EVENTS; email: string }) {
  const t = useT();
  const toast = useToast();
  const [p, setP] = useState(prefs);
  const [busy, start] = useTransition();
  const flip = (key: NotifyEvent, channel: 'app' | 'email') => {
    const next = { ...p, [key]: { ...p[key], [channel]: !p[key][channel] } };
    setP(next);
    start(async () => {
      const r = await saveNotifyPrefs(next);
      if (!r.ok) { setP(p); toast(r.error); } else toast('Setting saved');
    });
  };
  return (
    <>
      <h2>{t('Notification settings')}</h2>
      <p className="meta" style={{ marginTop: -4 }}>{t('Emails go to {email}.', { email })}</p>
      <table>
        <thead><tr><th>{t('Event')}</th><th>{t('In-app')}</th><th>{t('Email')}</th></tr></thead>
        <tbody>
          {events.map(e => (
            <tr key={e.key}>
              <td><b>{t(e.label)}</b><div className="meta">{t(e.sub)}</div></td>
              <td><input type="checkbox" aria-label={t('In-app')} checked={p[e.key].app} disabled={busy} onChange={() => flip(e.key, 'app')} /></td>
              <td><input type="checkbox" aria-label={t('Email')} checked={p[e.key].email} disabled={busy} onChange={() => flip(e.key, 'email')} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

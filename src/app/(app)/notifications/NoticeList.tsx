'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { Notice } from '@/lib/types';
import { useT, useToast } from '@/components/Providers';
import { when } from '@/components/ui';

// Which notifications were read is remembered in this browser only (no table for it yet).
function loadRead(key: string): string[] {
  try { return JSON.parse(localStorage.getItem(key) ?? '[]'); } catch { return []; }
}
function saveRead(key: string, ids: string[]) {
  try { localStorage.setItem(key, JSON.stringify(ids)); } catch { /* storage blocked: read state is not kept */ }
  window.dispatchEvent(new Event('lf-read')); // updates the bell in the top bar
}

const EVENTS = ['Matches', 'Claims', 'Thanks', 'Storage reminders'];

export function NoticeList({ notices, storageKey }: { notices: Notice[]; storageKey: string }) {
  const t = useT();
  const toast = useToast();
  const [read, setRead] = useState<string[]>([]);
  const [onlyUnread, setOnlyUnread] = useState(false);
  useEffect(() => setRead(loadRead(storageKey)), [storageKey]);

  const mark = (ids: string[]) => {
    const next = [...new Set([...read, ...ids])];
    setRead(next);
    saveRead(storageKey, next);
  };
  const list = notices.filter(n => !onlyUnread || !read.includes(n.id));

  return (
    <>
      <div className="seg tabrow">
        <button className={onlyUnread ? '' : 'on'} onClick={() => setOnlyUnread(false)}>{t('All')}</button>
        <button className={onlyUnread ? 'on' : ''} onClick={() => setOnlyUnread(true)}>{t('Unread')}</button>
      </div>
      {list.length ? list.map(n => (
        <Link key={n.id} href={n.href} onClick={() => mark([n.id])} style={{ color: 'inherit', textDecoration: 'none' }}>
          <div className="tag">
            <div className="row">
              <div><span className={'dot' + (read.includes(n.id) ? ' off' : '')} /><b>{t(n.title)}</b><div className="meta">{n.text}</div></div>
              <span className="meta">{when(n.at)}</span>
            </div>
          </div>
        </Link>
      )) : <div className="box meta">{t('No notifications.')}</div>}
      <div className="btnrow"><button className="btn sec" onClick={() => mark(notices.map(n => n.id))}>{t('Mark all as read')}</button></div>

      {/* MOCK: delivery settings are not saved yet. */}
      <h2>{t('Notification settings')}</h2>
      <table>
        <thead><tr><th>{t('Event')}</th><th>{t('In-app')}</th><th>{t('Email')}</th></tr></thead>
        <tbody>
          {EVENTS.map(e => (
            <tr key={e}>
              <td>{t(e)}</td>
              <td><input type="checkbox" defaultChecked onChange={() => toast('Setting saved')} /></td>
              <td><input type="checkbox" onChange={() => toast('Setting saved')} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

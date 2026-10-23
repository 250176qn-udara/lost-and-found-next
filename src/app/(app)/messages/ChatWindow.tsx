'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState, useTransition } from 'react';
import { markOfficeRead, sendOfficeMessage } from '@/app/actions';
import type { OfficeMessage } from '@/lib/data';
import { Buddy, BuddyPair } from '@/components/ChatBuddies';
import { useT } from '@/components/Providers';
import { ErrorText } from '@/components/ui';

const QUICK_STAFF = ['Please bring the item to the office.', 'Your item is ready to pick up.', 'Could you tell us more about the item?'];
const QUICK_MEMBER = ['When is the office open?', 'I will come to pick it up today.', 'Thank you!'];
/** How often an open chat checks for new messages. */
const POLL_MS = 5000;

/** One conversation. memberId = null for the member's own chat with the office. */
export function ChatWindow({ memberId, messages, viewer, title, meId }: { memberId: number | null; messages: OfficeMessage[]; viewer: 'staff' | 'member'; title: string; meId: number }) {
  const t = useT();
  const router = useRouter();
  const [text, setText] = useState('');
  const [err, setErr] = useState('');
  const [busy, start] = useTransition();
  const log = useRef<HTMLDivElement>(null);
  const staff = viewer === 'staff';
  const unread = messages.some(m => m.fromStaff !== staff && !m.readAt);

  // New messages: poll while the tab is visible.
  useEffect(() => {
    const id = setInterval(() => { if (document.visibilityState === 'visible') router.refresh(); }, POLL_MS);
    return () => clearInterval(id);
  }, [router]);
  useEffect(() => { if (unread) markOfficeRead(memberId).catch(() => {}); }, [memberId, unread, messages.length]);
  useEffect(() => { log.current?.scrollTo({ top: log.current.scrollHeight, behavior: 'smooth' }); }, [messages.length]);

  function send(body = text) {
    setErr('');
    if (!body.trim()) return setErr('Please write a message.');
    start(async () => {
      const r = await sendOfficeMessage(memberId, body);
      if (!r.ok) return setErr(r.error);
      setText('');
      router.refresh();
    });
  }

  const who = (m: OfficeMessage) => {
    if (m.senderId === meId) return t('You');
    if (!m.fromStaff) return title;
    if (m.system) return t('Lost & Found');
    return staff ? m.senderName ?? t('Office') : t('Office');
  };

  return (
    <div className="box chatwin">
      <div className="chatwin-head">
        <BuddyPair size={40} />
        <div style={{ minWidth: 0 }}><b>{title}</b><div className="meta">{t(staff ? 'Member' : 'Staff and admins of your organization')}</div></div>
        <span className="grow" />
        <span className="meta buddy-names">🐻 {t('Kuma (office)')} · 🐰 {t('Usa (student)')}</span>
      </div>
      <div className="chatwin-log" ref={log}>
        {messages.length === 0 && (
          <div className="chat-empty">
            <BuddyPair size={72} speech={t(staff ? 'Say hello! Write the first message below.' : 'Hi! We are Kuma and Usa. Ask the office anything about your lost or found items.')} />
          </div>
        )}
        {messages.map((m, i) => {
          const mine = m.fromStaff === staff;
          const day = m.createdAt.slice(0, 10);
          return (
            <div key={m.id}>
              {(i === 0 || messages[i - 1].createdAt.slice(0, 10) !== day) && <div className="chatday">{day}</div>}
              <div className={'chatrow' + (mine ? ' me' : '')}>
                <Buddy who={m.fromStaff ? 'office' : 'student'} size={34} label={m.fromStaff ? t('Kuma (office)') : t('Usa (student)')} />
                <div className={'bubble' + (mine ? ' me' : '')}>
                  {m.body}
                  {m.itemId && <Link href={`/items/${m.itemId}`} className="bubble-link">{t('Open the item')} →</Link>}
                  <small>{who(m)} · {m.createdAt.slice(11, 16)}{mine && m.readAt ? ` · ${t('Read')}` : ''}</small>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="chips" style={{ margin: '10px 18px 8px' }}>
        {(staff ? QUICK_STAFF : QUICK_MEMBER).map(q => <button key={q} type="button" disabled={busy} onClick={() => setText(t(q))}>{t(q)}</button>)}
      </div>
      <div className="chat-input">
        <textarea rows={2} maxLength={2000} value={text} onChange={e => setText(e.target.value)} placeholder={t('Write a message')}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); send(); } }} />
        <button className="btn" disabled={busy} onClick={() => send()}>{t(busy ? 'Sending…' : 'Send')}</button>
      </div>
      <p className="meta" style={{ margin: '4px 18px 0' }}>{t('Enter to send, Shift+Enter for a new line.')}</p>
      <ErrorText msg={t(err)} />
    </div>
  );
}

'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, useTransition } from 'react';
import { markFinderMessagesRead, sendFinderMessage } from '@/app/actions';
import type { ClaimMessage } from '@/lib/data';
import { Icon } from './Icon';
import { useT, useToast } from './Providers';
import { ErrorText } from './ui';

/** Ready-made messages: with a claim the owner is waiting; without one, a plain request to bring it in. */
const QUICK_CLAIMED = [
  'The owner needs this item urgently. Could you bring it to the office today?',
  'When can you bring the item to the office?',
  'Please hand it to the reception. Thank you for your help!',
];
const QUICK_OPEN = [
  'Please bring the item to the office (reception) when you can.',
  'When can you bring the item to the office?',
  'Thank you for posting it! Please hand it to the reception.',
];

/**
 * On a claim card at the front desk and on the item page: talk to the member who found the item while they still have it.
 * Staff only. The finder sees "Office" and the item, never who claimed it.
 */
export function FinderChat({ itemId, finderName, handedIn, claimed, messages, messagesHref }: {
  itemId: number; finderName: string; handedIn: boolean; claimed: boolean; messages: ClaimMessage[]; messagesHref: string;
}) {
  const t = useT();
  const toast = useToast();
  const [text, setText] = useState('');
  const [err, setErr] = useState('');
  const [busy, start] = useTransition();
  const end = useRef<HTMLDivElement>(null);
  const unread = messages.some(m => !m.fromStaff && !m.readAt);

  useEffect(() => { if (unread) markFinderMessagesRead(itemId).catch(() => {}); }, [itemId, unread]);
  useEffect(() => { end.current?.scrollIntoView({ block: 'nearest' }); }, [messages.length]);

  function send(body = text) {
    setErr('');
    if (!body.trim()) return setErr('Please write a message.');
    start(async () => {
      const r = await sendFinderMessage(itemId, body);
      if (!r.ok) return setErr(r.error);
      setText('');
      toast('Message sent to the finder');
    });
  }

  return (
    <div className="chat finderchat">
      <div className="sec-title" style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
        <span><Icon name="hand" size={15} /> {t('Message the finder')} · {finderName}</span>
        <Link href={messagesHref} style={{ textTransform: 'none', letterSpacing: 0, fontWeight: 500 }}>{t('Open in Messages')} →</Link>
      </div>
      <p className="meta" style={{ margin: '0 0 8px' }}>
        {t(handedIn ? 'The finder says they brought it to the office. Confirm it when you have it.' : claimed ? 'The finder still has the item. Ask them to bring it to the office. They will not see who claimed it.' : 'The finder still has the item. Nobody has claimed it yet.')}
      </p>
      {messages.length > 0 && (
        <div className="chat-log">
          {messages.map(m => (
            <div key={m.id} className={'bubble' + (m.fromStaff ? ' me' : '')}>
              {m.body}
              <small>{m.fromStaff ? t('Office') + ` · ${m.senderName}` : m.senderName} · {m.createdAt.slice(5, 16)}</small>
            </div>
          ))}
          <div ref={end} />
        </div>
      )}
      <div className="chips" style={{ margin: '0 0 8px' }}>
        {(claimed ? QUICK_CLAIMED : QUICK_OPEN).map(q => <button key={q} type="button" disabled={busy} onClick={() => setText(t(q))}>{t(q)}</button>)}
      </div>
      <div className="chat-input">
        <textarea rows={2} maxLength={1000} value={text} onChange={e => setText(e.target.value)} placeholder={t('Write to the finder')}
          onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) send(); }} />
        <button className="btn" disabled={busy} onClick={() => send()}>{t('Send')}</button>
      </div>
      <ErrorText msg={t(err)} />
    </div>
  );
}

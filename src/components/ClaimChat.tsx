'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, useTransition } from 'react';
import { markClaimMessagesRead, sendClaimMessage } from '@/app/actions';
import type { ClaimMessage } from '@/lib/data';
import { useT, useToast } from './Providers';
import { ErrorText } from './ui';

const QUICK_STAFF = ['What colour is it exactly?', 'What is inside it?', 'Where and when did you lose it?', 'Can you describe any marks or stickers?'];

/**
 * Questions and answers about one claim. Staff see the claimant's name; the claimant sees "Office".
 * Opening it marks the other side's messages as read.
 */
export function ClaimChat({ claimId, messages, viewer, open, messagesHref }: {
  claimId: number; messages: ClaimMessage[]; viewer: 'staff' | 'claimant'; open: boolean; messagesHref: string;
}) {
  const t = useT();
  const toast = useToast();
  const [text, setText] = useState('');
  const [err, setErr] = useState('');
  const [busy, start] = useTransition();
  const end = useRef<HTMLDivElement>(null);
  const staff = viewer === 'staff';
  const unread = messages.some(m => m.fromStaff !== staff && !m.readAt);

  useEffect(() => { if (unread) markClaimMessagesRead(claimId).catch(() => {}); }, [claimId, unread]);
  useEffect(() => { end.current?.scrollIntoView({ block: 'nearest' }); }, [messages.length]);

  function send(body = text) {
    setErr('');
    if (!body.trim()) return setErr('Please write a message.');
    start(async () => {
      const r = await sendClaimMessage(claimId, body);
      if (!r.ok) return setErr(r.error);
      setText('');
      toast(staff ? 'Question sent to the claimant' : 'Reply sent to the office');
    });
  }

  return (
    <div className="chat">
      <div className="sec-title" style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
        <span>{t(staff ? 'Questions to the claimant' : 'Messages with the office')}</span>
        <Link href={messagesHref} style={{ textTransform: 'none', letterSpacing: 0, fontWeight: 500 }}>{t('Open in Messages')} →</Link>
      </div>
      {messages.length ? (
        <div className="chat-log">
          {messages.map(m => {
            const mine = m.fromStaff === staff;
            return (
              <div key={m.id} className={'bubble' + (mine ? ' me' : '')}>
                {m.body}
                <small>{mine ? t('You') : m.fromStaff ? t('Office') + (staff ? ` · ${m.senderName}` : '') : m.senderName} · {m.createdAt.slice(5, 16)}</small>
              </div>
            );
          })}
          <div ref={end} />
        </div>
      ) : <p className="meta" style={{ margin: '0 0 8px' }}>{t(staff ? 'Not sure yet? Ask the claimant a question before you decide.' : 'If the office has a question about your claim, it appears here.')}</p>}
      {open && (
        <>
          {staff && (
            <div className="chips" style={{ margin: '0 0 8px' }}>
              {QUICK_STAFF.map(q => <button key={q} type="button" disabled={busy} onClick={() => setText(t(q))}>{t(q)}</button>)}
            </div>
          )}
          <div className="chat-input">
            <textarea rows={2} maxLength={1000} value={text} onChange={e => setText(e.target.value)} placeholder={t(staff ? 'Ask the claimant a question' : 'Write your reply')}
              onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) send(); }} />
            <button className="btn" disabled={busy} onClick={() => send()}>{t('Send')}</button>
          </div>
          <ErrorText msg={t(err)} />
        </>
      )}
    </div>
  );
}

'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { sendThanks } from '@/app/actions';
import { THANKS_POINTS } from '@/lib/constants';
import { CARD_DESIGNS } from '@/lib/gifts';
import { useT, useToast } from '@/components/Providers';
import { ThankYouCard } from '@/components/ThankYouCard';
import { ErrorText } from '@/components/ui';

const PHRASES = ['Thank you so much for finding it!', 'You saved my day.', 'Thank you for taking it to the office.'];

/** The owner's thank-you letter (required) with optional thank-you points for the finder (no money involved). */
export function ThanksForm({ claimId, itemTitle, userName }: { claimId: number; itemTitle: string; userName: string }) {
  const t = useT();
  const toast = useToast();
  const router = useRouter();
  const [card, setCard] = useState<string>(CARD_DESIGNS[0]);
  const [message, setMessage] = useState('');
  const [showName, setShowName] = useState(false);
  const [points, setPoints] = useState(THANKS_POINTS[2]);
  const [onWall, setOnWall] = useState(true);
  const [err, setErr] = useState('');
  const [busy, start] = useTransition();

  function submit() {
    setErr('');
    if (!message.trim()) return setErr('Please write a thank-you message.');
    start(async () => {
      const res = await sendThanks(claimId, { message, card, showName, points, onWall });
      if (!res.ok) return setErr(res.error);
      toast(points ? 'Your letter and points were sent' : 'Your letter was sent');
      router.push('/my-items?tab=thanks');
    });
  }

  return (
    <div className="cols">
      <div>
        <div className="box" style={{ marginBottom: 16 }}>
          <h2 style={{ marginTop: 0 }}>{t('1. Choose a card')}</h2>
          <div className="cardpick">
            {CARD_DESIGNS.map(d => (
              <button key={d} type="button" className={'letter mini ' + d + (card === d ? ' on' : '')} onClick={() => setCard(d)} aria-label={t(d)}>
                <span>{t(d)}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="box" style={{ marginBottom: 16 }}>
          <h2 style={{ marginTop: 0 }}>{t('2. Write your letter')} <span className="badge no">{t('Required')}</span></h2>
          <div className="chips" style={{ marginTop: 0 }}>
            {PHRASES.map(p => <button key={p} type="button" onClick={() => setMessage(m => (m ? m + '\n' : '') + t(p))}>{t(p)}</button>)}
          </div>
          <textarea className="fullinput" rows={5} maxLength={1000} value={message} onChange={e => setMessage(e.target.value)} placeholder={t('Write a few words to the person who found your item')} />
          <label className="chk"><input type="checkbox" checked={showName} onChange={e => setShowName(e.target.checked)} /><span>{t('Sign with my name ({name})', { name: userName })}</span></label>
        </div>
        <div className="box">
          <h2 style={{ marginTop: 0 }}>{t('3. Add thank-you points')} <span className="badge">{t('Optional')}</span></h2>
          <div className="pointpick" role="radiogroup" aria-label={t('Thank-you points')}>
            {THANKS_POINTS.map(p => (
              <button key={p} type="button" role="radio" aria-checked={points === p} className={points === p ? 'on' : ''} onClick={() => setPoints(p)}>
                {p ? <><b>+{p}</b><span>{t('points')}</span></> : <span>{t('No points')}</span>}
              </button>
            ))}
          </div>
          <p className="meta" style={{ marginBottom: 0 }}>{t('Points are a way to say thanks and help the finder level up. They are free, and cannot be bought or exchanged for money or goods.')}</p>
        </div>
        <label className="sw askhelp" style={{ marginTop: 16 }}>
          <span>🎉 {t('Share this return on the thank-you wall')}<div className="meta">{t('Only the kind of item and the building are shown, never names or your letter.')}</div></span>
          <input type="checkbox" checked={onWall} onChange={e => setOnWall(e.target.checked)} />
        </label>
        <ErrorText msg={t(err)} />
        <div className="btnrow">
          <button className="btn" disabled={busy} onClick={submit}>{t(points ? 'Send letter and {n} points' : 'Send letter', { n: points })}</button>
        </div>
      </div>
      <div>
        <div className="sec-title">{t('Preview')}</div>
        <ThankYouCard design={card} message={message} from={showName ? userName : t('The owner of {item}', { item: itemTitle })}>
          {points > 0 && <div className="letter-points">⭐ +{points} {t('thank-you points')}</div>}
        </ThankYouCard>
      </div>
    </div>
  );
}

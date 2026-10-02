'use client';

/* eslint-disable @typescript-eslint/no-explicit-any */
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState, useTransition } from 'react';
import { sendThanks } from '@/app/actions';
import { CARD_DESIGNS, GIFT_AMOUNTS, GIFT_BRANDS } from '@/lib/gifts';
import { useT, useToast } from '@/components/Providers';
import { ThankYouCard } from '@/components/ThankYouCard';
import { ErrorText, Field } from '@/components/ui';

const PUBLIC_KEY = process.env.NEXT_PUBLIC_PAYJP_PUBLIC_KEY ?? '';
const PHRASES = ['Thank you so much for finding it!', 'You saved my day.', 'Thank you for taking it to the office.'];

let payjpScript: Promise<void> | null = null;
function loadPayjp(): Promise<void> {
  if ((window as any).Payjp) return Promise.resolve();
  payjpScript ??= new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://js.pay.jp/v2/pay.js';
    s.onload = () => resolve();
    s.onerror = () => { payjpScript = null; reject(new Error('Card form could not be loaded')); };
    document.head.appendChild(s);
  });
  return payjpScript;
}

/** The owner's thank-you letter (required) with an optional e-gift paid by card (PAY.JP + 3-D Secure). */
export function ThanksForm({ claimId, itemTitle, userName, userEmail, giftsOn }: {
  claimId: number; itemTitle: string; userName: string; userEmail: string; giftsOn: boolean;
}) {
  const t = useT();
  const toast = useToast();
  const router = useRouter();
  const [card, setCard] = useState<string>(CARD_DESIGNS[0]);
  const [message, setMessage] = useState('');
  const [showName, setShowName] = useState(false);
  const [gift, setGift] = useState(false);
  const [brand, setBrand] = useState(GIFT_BRANDS[0].key);
  const [amount, setAmount] = useState(GIFT_AMOUNTS[1]);
  const [holder, setHolder] = useState(userName);
  const [err, setErr] = useState('');
  const [busy, start] = useTransition();
  const payjp = useRef<any>(null);
  const cardEl = useRef<any>(null);
  const testMode = PUBLIC_KEY.startsWith('pk_test_');

  // Mount PAY.JP's card field only when a gift is added (card numbers stay inside PAY.JP's frame).
  useEffect(() => {
    if (!gift || !giftsOn || cardEl.current) return;
    loadPayjp().then(() => {
      payjp.current ??= (window as any).Payjp(PUBLIC_KEY, { locale: document.documentElement.lang === 'ja' ? 'ja' : 'en' });
      cardEl.current = payjp.current.elements().create('card', { style: { base: { fontSize: '15px', color: '#1e293b' } } });
      cardEl.current.mount('#payjp-card');
    }).catch(e => setErr(e.message));
  }, [gift, giftsOn]);

  function submit() {
    setErr('');
    if (!message.trim()) return setErr('Please write a thank-you message.');
    if (gift && !holder.trim()) return setErr('Please enter the name on the card.');
    start(async () => {
      let token = '';
      if (gift) {
        if (!payjp.current || !cardEl.current) return setErr('Card form could not be loaded');
        // 3-D Secure (required for card payments in Japan): PAY.JP opens the card issuer's check if needed.
        const r = await payjp.current.createToken(cardEl.current, { three_d_secure: true, card: { name: holder.trim(), email: userEmail } })
          .catch((e: any) => ({ error: { message: e?.message ?? 'Card error' } }));
        if (r.error) return setErr(r.error.message);
        token = r.id;
      }
      const res = await sendThanks(claimId, { message, card, showName, gift: gift ? { brand, amount, token } : null });
      if (!res.ok) return setErr(res.error);
      toast(gift ? 'Your letter and gift were sent' : 'Your letter was sent');
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
          <h2 style={{ marginTop: 0 }}>{t('3. Add an e-gift')} <span className="badge">{t('Optional')}</span></h2>
          {!giftsOn ? <p className="meta">{t('E-gifts are not available yet. You can still send your letter.')}</p> : (
            <>
              <label className="chk"><input type="checkbox" checked={gift} onChange={e => setGift(e.target.checked)} /><span>{t('Add an e-gift card to my letter')}</span></label>
              {gift && (
                <>
                  <div className="sec-title" style={{ marginTop: 12 }}>{t('Gift card')}</div>
                  <div className="chips" style={{ marginTop: 0 }}>
                    {GIFT_BRANDS.map(b => <button key={b.key} type="button" className={brand === b.key ? 'on' : ''} onClick={() => setBrand(b.key)}>{t(b.name)}</button>)}
                  </div>
                  <div className="sec-title">{t('Amount')}</div>
                  <div className="chips" style={{ marginTop: 0 }}>
                    {GIFT_AMOUNTS.map(a => <button key={a} type="button" className={amount === a ? 'on' : ''} onClick={() => setAmount(a)}>¥{a.toLocaleString()}</button>)}
                  </div>
                  <Field label={t('Name on the card')}><input value={holder} onChange={e => setHolder(e.target.value)} autoComplete="cc-name" /></Field>
                  <div className="field"><label>{t('Card')}</label><div id="payjp-card" className="payjp-field" /></div>
                  {testMode && <p className="meta">{t('Test mode: no real money moves. Use card 4242 4242 4242 4242, any future date, any CVC.')}</p>}
                  <p className="meta">{t('Payment is processed by PAY.JP with 3-D Secure. This app never sees or stores your card number.')}</p>
                </>
              )}
            </>
          )}
        </div>
        <ErrorText msg={t(err)} />
        <div className="btnrow">
          <button className="btn" disabled={busy} onClick={submit}>{t(gift ? 'Pay ¥{n} and send' : 'Send letter', { n: amount.toLocaleString() })}</button>
        </div>
      </div>
      <div>
        <div className="sec-title">{t('Preview')}</div>
        <ThankYouCard design={card} message={message} from={showName ? userName : t('The owner of {item}', { item: itemTitle })}>
          {gift && <div className="letter-gift">🎁 {t(GIFT_BRANDS.find(b => b.key === brand)!.name)} ¥{amount.toLocaleString()}</div>}
        </ThankYouCard>
      </div>
    </div>
  );
}

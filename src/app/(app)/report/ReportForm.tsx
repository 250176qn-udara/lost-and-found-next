'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';
import { reportItem, type ReportMatch } from '@/app/actions';
import { scoreClass } from '@/lib/match';
import { Icon } from '@/components/Icon';
import { MAX_PHOTO_BYTES } from '@/lib/constants';
import type { Kind, Place } from '@/lib/types';
import { PlacePicker, type PlaceValue } from '@/components/PlacePicker';
import { useT, useToast } from '@/components/Providers';
import { Callout, ErrorText, Field, Head, Kv, placeDate } from '@/components/ui';
import { AiPhotoFill } from '@/components/AiPhotoFill';

const STEPS = ['Type', 'Item', 'Where & when', 'Photo', 'Review'];

/** Five-step report wizard. Colour, brand and marks are saved inside the description. */
export function ReportForm({ initialKind, isMember, afterPath, places, categories, keepDays = 5, ai = false }:
  { initialKind: Kind; isMember: boolean; afterPath: string; places: Place[]; categories: string[]; keepDays?: number; ai?: boolean }) {
  const t = useT();
  const toast = useToast();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [kind, setKind] = useState<Kind>(initialKind);
  const [f, setF] = useState({ title: '', category: categories[0], colour: '', brand: '', marks: '', date: '', description: '' });
  const [where, setWhere] = useState<PlaceValue>({ place: '', lat: null, lng: null });
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState('');
  const [err, setErr] = useState('');
  const [busy, start] = useTransition();
  const [done, setDone] = useState<ReportMatch | null>(null);
  const [askHelp, setAskHelp] = useState(true);
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });

  useEffect(() => {
    if (!photo) return setPreview('');
    const url = URL.createObjectURL(photo);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [photo]);

  function next() {
    setErr('');
    if (step === 2 && !f.title.trim()) return setErr('Please enter the item name.');
    if (step === 3 && !where.place.trim()) return setErr('Please choose or type the place.');
    setStep(step + 1);
  }

  function pickPhoto(file: File | undefined) {
    setErr('');
    if (file && file.size > MAX_PHOTO_BYTES) { setPhoto(null); return setErr('Photo is too large. Please use a smaller image.'); }
    setPhoto(file ?? null);
  }

  function submit() {
    const description = [
      f.colour && `${t('Colour')}: ${f.colour}`, f.brand && `${t('Brand')}: ${f.brand}`, f.marks && `${t('Marks or stickers')}: ${f.marks}`, f.description,
    ].filter(Boolean).join('\n');
    const fd = new FormData();
    fd.set('kind', kind);
    fd.set('title', f.title);
    fd.set('category', f.category);
    fd.set('place', where.place.trim());
    fd.set('lat', where.lat === null ? '' : String(where.lat));
    fd.set('lng', where.lng === null ? '' : String(where.lng));
    fd.set('item_date', f.date);
    fd.set('description', description);
    if (kind === 'lost' && askHelp) fd.set('ask_help', '1');
    if (photo) fd.set('photo', photo);
    setErr('');
    start(async () => {
      const r = await reportItem(fd);
      if (!r.ok) return setErr(r.error);
      toast(kind === 'found' ? 'Posted. Everyone in your community can now see it' : 'Report submitted');
      setDone(r.report); // show what the matching found before leaving
    });
  }

  if (done) return (
    <>
      <Head title={t('Report an item')} sub={t('Tell us what you lost or found.')} />
      <MatchResult kind={kind} r={done} title={f.title} keepDays={keepDays} onDone={() => router.push(afterPath)} />
    </>
  );

  return (
    <>
      <Head title={t('Report an item')} sub={t('Tell us what you lost or found.')} />
      <div className="wiz">
        {STEPS.map((s, i) => <span key={s} className={step === i + 1 ? 'on' : step > i + 1 ? 'done' : ''}><b>{i + 1}</b> {t(s)}</span>)}
      </div>
      <div className="box" style={{ maxWidth: 680 }}>
        {step === 1 && (
          <>
            <div className="seg">
              <button className={kind === 'lost' ? 'on' : ''} onClick={() => setKind('lost')}>{t('I lost something')}</button>
              <button className={kind === 'found' ? 'on' : ''} onClick={() => setKind('found')}>{t('I found something')}</button>
            </div>
            {kind === 'found' ? (
              <Callout kind="teal">
                <b>{t('It is listed for your community right away')}</b>
                <div className="meta">{t('Everyone in your community can see it in Found items and the owner can claim it. Keep it safe. Staff check the owner’s ID before it is returned.')}</div>
                <div className="meta" style={{ marginTop: 6 }}><b>{t('You may keep it for up to {n} days. Then please bring it to the office, even if nobody has claimed it.', { n: keepDays })}</b></div>
                {!isMember && <div className="meta" style={{ marginTop: 6 }}>{t('If the item is already at the office, use Register found item to add its shelf.')}</div>}
              </Callout>
            ) : <p className="meta">{t('Tell us what you lost. We will look for it among the found items.')}</p>}
          </>
        )}

        {step === 2 && (
          <>
            {ai && <AiPhotoFill onResult={(g, file) => {
              setF(x => ({ ...x, title: g.title, category: g.category, colour: g.colour || x.colour, brand: g.brand || x.brand, marks: g.marks || x.marks }));
              setPhoto(file);
            }} />}
            <Field label={t('Item name')}><input value={f.title} onChange={set('title')} placeholder={t('e.g. Black wallet')} autoFocus /></Field>
            <div className="two">
              <Field label={t('Category')}><select value={f.category} onChange={set('category')}>{categories.map(c => <option key={c} value={c}>{t(c)}</option>)}</select></Field>
              <Field label={t('Colour')}><input value={f.colour} onChange={set('colour')} /></Field>
            </div>
            <div className="two">
              <Field label={t('Brand')}><input value={f.brand} onChange={set('brand')} /></Field>
              <Field label={t('Marks or stickers')}><input value={f.marks} onChange={set('marks')} /></Field>
            </div>
            <div className="hidden-note" style={{ marginBottom: 14 }}>
              <div className="meta" style={{ marginBottom: 0 }}>{t(kind === 'found'
                ? 'Colour, brand, marks and the description are private: only staff see them and use them to check the real owner.'
                : 'The more details you give, the easier it is to prove the item is yours.')}</div>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <PlacePicker places={places} value={where} onChange={setWhere} />
            <div className="two" style={{ marginTop: 12 }}>
              <Field label={t('Date')}><input type="date" value={f.date} onChange={set('date')} /></Field>
            </div>
          </>
        )}

        {step === 4 && (
          <>
            <Field label={t('Photo')}><input type="file" accept="image/*" onChange={e => pickPhoto(e.target.files?.[0])} /></Field>
            {preview && <img src={preview} alt="" style={{ maxWidth: 220, borderRadius: 12, marginBottom: 12 }} />}
            <Field label={t(kind === 'found' ? 'Private details (only staff see these)' : 'Description')}>
              <textarea rows={3} value={f.description} onChange={set('description')} placeholder={t(kind === 'found' ? 'e.g. what is inside, a name tag, a scratch' : 'Anything else that helps')} />
            </Field>
          </>
        )}

        {step === 5 && (
          <>
            <h2 style={{ marginTop: 0 }}>{t('Check your report')}</h2>
            <Kv label={t('Type')} value={t(kind === 'lost' ? 'Lost' : 'Found')} />
            <Kv label={t('Item name')} value={f.title} />
            <Kv label={t('Category')} value={t(f.category)} />
            <Kv label={t('Colour')} value={f.colour} />
            <Kv label={t('Brand')} value={f.brand} />
            <Kv label={t('Marks or stickers')} value={f.marks} />
            <Kv label={t('Place')} value={t(where.place)} />
            {where.lat !== null && <Kv label={t('Map pin')} value={`${where.lat.toFixed(5)}, ${where.lng!.toFixed(5)}`} />}
            <Kv label={t('Date')} value={f.date} />
            <Kv label={t('Description')} value={f.description} />
            {photo && <div className="meta">{t('Photo attached')}</div>}
            {kind === 'lost' && (
              <label className="sw askhelp">
                <span>👀 {t('Ask others to look out for it')}<div className="meta">{t('Students who watch this building get a “Have you seen this?” alert. They see only the name, category, place, date and photo, never your name or details.')}</div></span>
                <input type="checkbox" checked={askHelp} onChange={e => setAskHelp(e.target.checked)} />
              </label>
            )}
            <div className={'aimatch' + (busy ? ' busy' : '')}>
              <Icon name={ai ? 'spark' : 'search'} size={18} />
              <span>{t(busy
                ? (ai ? 'AI is comparing your report with the items in your community…' : 'Looking for a match…')
                : ai ? (kind === 'lost'
                    ? 'After you submit, AI compares your report with the found items (name, colour, brand, place and photos).'
                    : 'After you submit, AI compares this item with the lost reports to find the owner.')
                  : 'After you submit, we compare it with items of the same category, place and date.')}</span>
            </div>
          </>
        )}

        <div style={{ marginTop: 10 }}><ErrorText msg={t(err)} /></div>
        <div className="btnrow">
          {step > 1 && <button className="btn sec" onClick={() => { setErr(''); setStep(step - 1); }}>{t('Back')}</button>}
          {step < 5
            ? <button className="btn" onClick={next}>{t('Next')}</button>
            : <button className="btn" disabled={busy} onClick={submit}>{t(busy ? 'Checking…' : 'Submit report')}</button>}
        </div>
      </div>
    </>
  );
}

/** After submitting: what the matching found (AI or rules). A finder never sees the owner's report. */
function MatchResult({ kind, r, title, keepDays, onDone }: { kind: Kind; r: ReportMatch; title: string; keepDays: number; onDone: () => void }) {
  const t = useT();
  const m = r.match;
  const checked = r.ai && r.checked > 0
    ? t(kind === 'lost' ? 'AI compared your report with {n} found items.' : 'AI compared it with {n} lost reports.', { n: r.checked })
    : '';
  return (
    <div className="box" style={{ maxWidth: 680 }}>
      <div className={'aimatch result' + (m ? ' hit' : '')}>
        <Icon name={m ? 'check' : r.ai ? 'spark' : 'search'} size={22} />
        <div style={{ flex: 1 }}>
          <b style={{ fontSize: 17 }}>{t(m
            ? (kind === 'lost' ? (m.ai ? 'AI found a possible match!' : 'Possible match found') : 'We may have found the owner!')
            : kind === 'lost' ? 'No match yet' : 'Posted')}</b>
          <div className="meta">{[checked, t(m
            ? (kind === 'lost' ? 'Check it in My items. If it is yours, press “This is mine”.' : 'The owner has been told. Keep the item safe until the office asks for it.')
            : kind === 'lost' ? 'We will tell you as soon as a matching item is posted.' : 'Everyone in your community can now see it. We will tell you if the owner claims it.')]
            .filter(Boolean).join(' ')}</div>
        </div>
      </div>
      {m && kind === 'lost' && (
        <div className="box" style={{ display: 'flex', gap: 16, alignItems: 'center', boxShadow: 'none', flexWrap: 'wrap', marginTop: 12 }}>
          <div style={{ flex: 1, minWidth: 180 }}>
            <span className="meta">{t('Your report')}: {title}</span>
            <div><b>{m.title}</b></div>
            <div className="meta">{placeDate(m.place, m.date, t)}</div>
            {m.ai && <div className="pillrow"><span className="pill ai"><Icon name="spark" size={13} /> {t('Checked by AI')}</span></div>}
          </div>
          <div style={{ textAlign: 'center' }}><div className={'score ' + scoreClass(m.score)}>{m.score}%</div><div className="meta">{t('Match score')}</div></div>
        </div>
      )}
      {kind === 'found' && (
        <div className="keeplimit" style={{ marginTop: 12 }}>
          <b>{t('Please bring it to the office within {n} days', { n: keepDays })}</b>
          <span className="meta">{t('Even if nobody claims it. We will remind you the day before.')}</span>
        </div>
      )}
      <div className="btnrow">
        <button className="btn" onClick={onDone}>{t(m && kind === 'lost' ? 'Check it now' : 'Done')}</button>
      </div>
    </div>
  );
}

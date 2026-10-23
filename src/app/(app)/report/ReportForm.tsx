'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';
import { reportItem } from '@/app/actions';
import { MAX_PHOTO_BYTES } from '@/lib/constants';
import type { Kind, Place } from '@/lib/types';
import { PlacePicker, type PlaceValue } from '@/components/PlacePicker';
import { useT, useToast } from '@/components/Providers';
import { Callout, ErrorText, Field, Head, Kv } from '@/components/ui';
import { AiPhotoFill } from '@/components/AiPhotoFill';

const STEPS = ['Type', 'Item', 'Where & when', 'Photo', 'Review'];

/** Five-step report wizard. Colour, brand and marks are saved inside the description. */
export function ReportForm({ initialKind, isMember, afterPath, places, categories, ai = false }:
  { initialKind: Kind; isMember: boolean; afterPath: string; places: Place[]; categories: string[]; ai?: boolean }) {
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
    if (photo) fd.set('photo', photo);
    setErr('');
    start(async () => {
      const r = await reportItem(fd);
      if (!r.ok) return setErr(r.error);
      if (kind === 'lost' && r.matched) toast('Possible match found');
      else toast(kind === 'found' ? 'Posted. Everyone in your community can now see it' : 'Report submitted');
      router.push(afterPath);
    });
  }

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
          </>
        )}

        <div style={{ marginTop: 10 }}><ErrorText msg={t(err)} /></div>
        <div className="btnrow">
          {step > 1 && <button className="btn sec" onClick={() => { setErr(''); setStep(step - 1); }}>{t('Back')}</button>}
          {step < 5
            ? <button className="btn" onClick={next}>{t('Next')}</button>
            : <button className="btn" disabled={busy} onClick={submit}>{t('Submit report')}</button>}
        </div>
      </div>
    </>
  );
}

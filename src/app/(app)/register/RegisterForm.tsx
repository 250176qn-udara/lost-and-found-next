'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useRef, useState, useTransition, type FormEvent } from 'react';
import { receiveAndRegister, type IntakeMatch } from '@/app/actions';
import { scoreClass } from '@/lib/match';
import { Icon } from '@/components/Icon';
import { PlacePicker, type PlaceValue } from '@/components/PlacePicker';
import type { Place, QueueItem } from '@/lib/types';
import { checkPhoto, PhotoInput } from '@/components/PhotoInput';
import { AiPhotoFill } from '@/components/AiPhotoFill';
import type { PhotoGuess } from '@/lib/gemini';
import { useT, useToast } from '@/components/Providers';
import { ErrorText, Field, placeDate } from '@/components/ui';

// Placeholder label pattern until real QR codes are added.

export function RegisterForm({ queued, afterPath, places, categories, shelves, ai = false }:
  { queued: QueueItem | null; afterPath: string; places: Place[]; categories: string[]; shelves: string[]; ai?: boolean }) {
  // A member's post may use a category that was later removed from the list; keep it selectable.
  const cats = queued?.category && !categories.includes(queued.category) ? [queued.category, ...categories] : categories;
  const t = useT();
  const toast = useToast();
  const router = useRouter();
  const [err, setErr] = useState('');
  const [where, setWhere] = useState<PlaceValue>({ place: queued?.place ?? '', lat: null, lng: null });
  const [busy, start] = useTransition();
  const [done, setDone] = useState<{ id: number; itemCode: string; shelf: string; report: IntakeMatch } | null>(null);

  const form = useRef<HTMLFormElement>(null);
  function fillFromAi(g: PhotoGuess, file: File) {
    const el = form.current?.elements;
    if (!el) return;
    const set = (name: string, v: string) => { const x = el.namedItem(name) as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | null; if (x && v) x.value = v; };
    set('title', g.title);
    set('category', cats.includes(g.category) ? g.category : '');
    const details = [g.colour && `${t('Colour')}: ${g.colour}`, g.brand && `${t('Brand')}: ${g.brand}`, g.marks && `${t('Marks or stickers')}: ${g.marks}`].filter(Boolean).join('\n');
    const desc = el.namedItem('description') as HTMLTextAreaElement | null;
    if (desc && details && !desc.value.trim()) desc.value = details;
    const photo = el.namedItem('photo') as HTMLInputElement | null;
    if (photo) { const dt = new DataTransfer(); dt.items.add(file); photo.files = dt.files; }
  }

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    if (queued) fd.set('existing_item_id', String(queued.id));
    setErr('');
    if (!String(fd.get('title') ?? '').trim()) return setErr('Please enter the item name.');
    const photoErr = checkPhoto(fd);
    if (photoErr) return setErr(photoErr);
    start(async () => {
      const r = await receiveAndRegister(fd);
      if (!r.ok) return setErr(r.error);
      toast(t('Item registered · {code} · Shelf {shelf}', { code: r.itemCode, shelf: r.shelf }));
      setDone(r); // show what the matching found, then label / next item
    });
  }

  if (done) return <IntakeResult done={done} queued={!!queued} afterPath={afterPath} onAnother={() => { setDone(null); setWhere({ place: '', lat: null, lng: null }); window.scrollTo(0, 0); }} />;

  return (
    <>
      {queued && (
        <div className="box" style={{ background: 'var(--tealbg)', borderColor: 'var(--teal)', marginBottom: 16 }}>
          <b>{t('Receiving an item reported by {name}', { name: queued.reporterName })}</b>
          <div className="meta">{t('It is already listed for the community. Check the details, then add the shelf where it is stored.')}</div>
        </div>
      )}
      <div className="grid" style={{ gridTemplateColumns: '1.5fr 1fr', alignItems: 'start' }}>
        <form className="box" onSubmit={submit} ref={form}>
          {ai && !queued && <AiPhotoFill onResult={fillFromAi} />}
          <Field label={t('Item name')}><input name="title" placeholder={t('e.g. Green scarf')} defaultValue={queued?.title ?? ''} /></Field>
          {!queued && (
            <div className="two">
              <Field label={t('Who found it')}>
                <select name="who">
                  <option>{t('A member handed it in')}</option>
                  <option>{t('Staff or admin found it')}</option>
                </select>
              </Field>
              <Field label={t('Finder name (for thanks)')}><input name="finder_name" placeholder={t('Optional')} /></Field>
            </div>
          )}
          <Field label={t('Category')}>
            <select name="category" defaultValue={queued?.category}>{cats.map(c => <option key={c} value={c}>{t(c)}</option>)}</select>
          </Field>
          <div className="field"><label>{t('Found at')}</label><PlacePicker places={places} value={where} onChange={setWhere} formNames /></div>
          <div className="two">
            <Field label={t('Found date')}><input name="item_date" type="date" defaultValue={queued?.date ?? ''} /></Field>
            <Field label={t('Storage shelf')}><select name="shelf">{shelves.map(s => <option key={s}>{s}</option>)}</select></Field>
          </div>
          <Field label={t('Description')}><textarea name="description" rows={2} placeholder={t('Color, size, marks')} defaultValue={queued?.description ?? ''} /></Field>
          <Field label={t('Photo')}><PhotoInput /></Field>
          <ErrorText msg={t(err)} />
          <p className="meta">{t('The item stays at the office until the owner shows ID.')}</p>
          {busy && <div className="aimatch busy" style={{ marginBottom: 10 }}><Icon name={ai ? 'spark' : 'search'} size={18} />
            <span>{t(ai ? 'AI is looking for the owner among the lost reports…' : 'Looking for a match…')}</span></div>}
          <button className="btn" disabled={busy}>{t(busy ? 'Checking…' : 'Register item')}</button>
          {queued && <> <Link className="btn sec" href="/register">{t('Cancel')}</Link></>}
        </form>
        <div className="box">
          <b>{t('When someone brings an item in')}</b>
          <p className="meta">{t('The finder does not have to fill anything in: you register it here for them. Their name is optional (for the thank-you).')}</p>
          <ol className="steplist" style={{ marginTop: 8 }}>
            <li><div><b>{t('Register it')}</b><div className="meta">{t(ai ? 'Tip: “Fill in from a photo” lets AI fill the form.' : 'Name, category, place and shelf.')}</div></div></li>
            <li><div><b>{t(ai ? 'AI looks for the owner' : 'We look for the owner')}</b><div className="meta">{t('Open lost reports are checked right away; the owner is notified.')}</div></div></li>
            <li><div><b>{t('Print the QR label')}</b><div className="meta">{t('Stick it on the item and put it on the shelf.')}</div></div></li>
          </ol>
        </div>
      </div>
    </>
  );
}

/** After Intake: item code + shelf, what the matching found (staff see the owner and the AI's reason), then the label. */
function IntakeResult({ done, queued, afterPath, onAnother }: {
  done: { id: number; itemCode: string; shelf: string; report: IntakeMatch }; queued: boolean; afterPath: string; onAnother: () => void;
}) {
  const t = useT();
  const r = done.report, m = r.match;
  return (
    <div className="box" style={{ maxWidth: 720 }}>
      <h2 style={{ marginTop: 0 }}>{t('Registered · {code} · Shelf {shelf}', { code: done.itemCode, shelf: done.shelf })}</h2>
      <div className={'aimatch result' + (m ? ' hit' : '')}>
        <Icon name={m ? 'check' : r.ai ? 'spark' : 'search'} size={22} />
        <div style={{ flex: 1 }}>
          <b style={{ fontSize: 17 }}>{t(m ? (r.already ? 'This item was already matched to a lost report' : m.ai ? 'AI found a possible owner!' : 'Possible owner found')
            : 'No lost report matches yet')}</b>
          <div className="meta">{[
            r.ai && r.checked > 0 ? t('AI compared it with {n} lost reports.', { n: r.checked }) : '',
            t(m ? 'The owner has been notified and can claim it. Check their answers on the Front desk.'
              : 'It is listed in Found items. The owner is told as soon as they report it lost.'),
          ].filter(Boolean).join(' ')}</div>
        </div>
      </div>
      {m && (
        <div className="box" style={{ display: 'flex', gap: 16, alignItems: 'center', boxShadow: 'none', flexWrap: 'wrap', marginTop: 12 }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <span className="meta">{t('Lost report')}</span>
            <div><Link href={`/items/${m.lostId}`}><b>{m.title}</b></Link> · {m.owner}</div>
            <div className="meta">{placeDate(m.place, m.date, t)}</div>
            {m.reason && <p className="meta" style={{ margin: '6px 0 0' }}><b>{t('AI')}:</b> {m.reason}</p>}
            {m.ai && <div className="pillrow"><span className="pill ai"><Icon name="spark" size={13} /> {t('Checked by AI')}</span></div>}
          </div>
          <div style={{ textAlign: 'center' }}><div className={'score ' + scoreClass(m.score)}>{m.score}%</div><div className="meta">{t('Match score')}</div></div>
        </div>
      )}
      <div className="btnrow">
        <Link className="btn" href={`/label/${done.id}?then=${encodeURIComponent(queued ? afterPath : '/register')}`}><Icon name="scan" size={16} />{t('Print label')}</Link>
        {queued ? <Link className="btn sec" href={afterPath}>{t('Back to the front desk')}</Link>
          : <button className="btn sec" onClick={onAnother}>{t('Register another item')}</button>}
        <Link className="btn sec" href={`/items/${done.id}`}>{t('Open the item')}</Link>
      </div>
    </div>
  );
}

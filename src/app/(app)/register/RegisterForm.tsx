'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition, type FormEvent } from 'react';
import { receiveAndRegister } from '@/app/actions';
import { CATEGORIES, SHELVES } from '@/lib/constants';
import { PlacePicker, type PlaceValue } from '@/components/PlacePicker';
import type { Place, QueueItem } from '@/lib/types';
import { checkPhoto, PhotoInput } from '@/components/PhotoInput';
import { useT, useToast } from '@/components/Providers';
import { ErrorText, Field } from '@/components/ui';

// Placeholder label pattern until real QR codes are added.
const QR_CELLS = Array.from({ length: 121 }, (_, i) => ((i * 7 + (i % 5) * 3 + (i >> 2)) % 3 ? '' : 'w'));

export function RegisterForm({ queued, afterPath, places }: { queued: QueueItem | null; afterPath: string; places: Place[] }) {
  const t = useT();
  const toast = useToast();
  const router = useRouter();
  const [err, setErr] = useState('');
  const [where, setWhere] = useState<PlaceValue>({ place: queued?.place ?? '', lat: null, lng: null });
  const [busy, start] = useTransition();

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
      router.push(afterPath);
    });
  }

  return (
    <>
      {queued && (
        <div className="box" style={{ background: 'var(--tealbg)', borderColor: 'var(--teal)', marginBottom: 16 }}>
          <b>{t('Receiving an item reported by {name}', { name: queued.reporterName })}</b>
          <div className="meta">{t('It is already listed for the community. Check the details, then add the shelf where it is stored.')}</div>
        </div>
      )}
      <div className="grid" style={{ gridTemplateColumns: '1.5fr 1fr', alignItems: 'start' }}>
        <form className="box" onSubmit={submit}>
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
            <select name="category" defaultValue={queued?.category}>{CATEGORIES.map(c => <option key={c} value={c}>{t(c)}</option>)}</select>
          </Field>
          <div className="field"><label>{t('Found at')}</label><PlacePicker places={places} value={where} onChange={setWhere} formNames /></div>
          <div className="two">
            <Field label={t('Found date')}><input name="item_date" type="date" defaultValue={queued?.date ?? ''} /></Field>
            <Field label={t('Storage shelf')}><select name="shelf">{SHELVES.map(s => <option key={s}>{s}</option>)}</select></Field>
          </div>
          <Field label={t('Description')}><textarea name="description" rows={2} placeholder={t('Color, size, marks')} defaultValue={queued?.description ?? ''} /></Field>
          <Field label={t('Photo')}><PhotoInput /></Field>
          <ErrorText msg={t(err)} />
          <p className="meta">{t('The item stays at the office until the owner shows ID.')}</p>
          <button className="btn" disabled={busy}>{t('Register item')}</button>
          {queued && <> <Link className="btn sec" href="/register">{t('Cancel')}</Link></>}
        </form>
        <div className="box">
          <b>{t('Storage label')}</b>
          <p className="meta">{t('Attach this to the item.')}</p>
          <div className="qr">{QR_CELLS.map((c, i) => <i key={i} className={c} />)}</div>
          <p className="meta">{t('Assigned automatically when you register the item.')}</p>
        </div>
      </div>
    </>
  );
}

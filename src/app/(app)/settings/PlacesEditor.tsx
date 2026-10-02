'use client';

import { useMemo, useState, useTransition } from 'react';
import { deletePlace, savePlace } from '@/app/actions';
import type { Place } from '@/lib/types';
import { GoogleMap, type MapMarker } from '@/components/GoogleMap';
import { useT, useToast } from '@/components/Providers';
import { ErrorText, Field } from '@/components/ui';

type Draft = { id: number; name: string; lat: number | null; lng: number | null };
const EMPTY: Draft = { id: 0, name: '', lat: null, lng: null };

/** Admins manage the places members choose from. Click the map to set a place's pin. */
export function PlacesEditor({ places }: { places: Place[] }) {
  const t = useT();
  const toast = useToast();
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [err, setErr] = useState('');
  const [busy, start] = useTransition();
  const markers = useMemo<MapMarker[]>(() => places.filter(p => p.lat !== null && p.id !== draft.id)
    .map(p => ({ id: p.id, lat: p.lat!, lng: p.lng!, title: t(p.name) })), [places, draft.id, t]);

  const save = () => start(async () => {
    setErr('');
    const r = await savePlace(draft.id, draft.name, draft.lat, draft.lng);
    if (!r.ok) return setErr(r.error);
    toast(draft.id ? 'Place updated' : 'Place added');
    setDraft(EMPTY);
  });
  const remove = (p: Place) => {
    if (!confirm(t('Remove "{name}" from the list? Items keep their place.', { name: t(p.name) }))) return;
    start(async () => {
      const r = await deletePlace(p.id);
      toast(r.ok ? 'Place removed' : r.error);
      if (draft.id === p.id) setDraft(EMPTY);
    });
  };

  return (
    <div className="cols">
      <div className="box">
        <h2 style={{ marginTop: 0 }}>{t(draft.id ? 'Edit place' : 'Add a place')}</h2>
        <Field label={t('Name')}><input value={draft.name} maxLength={100} onChange={e => setDraft({ ...draft, name: e.target.value })} placeholder={t('e.g. Library 2F')} /></Field>
        <p className="meta" style={{ margin: '0 0 8px' }}>{t('Click the map to set the pin.')}</p>
        <GoogleMap markers={markers} picked={draft.lat !== null ? { lat: draft.lat, lng: draft.lng! } : null}
          onPick={p => setDraft({ ...draft, lat: p.lat, lng: p.lng })} height={320} />
        <ErrorText msg={t(err)} />
        <div className="btnrow" style={{ marginTop: 0 }}>
          <button className="btn" disabled={busy} onClick={save}>{t(draft.id ? 'Save place' : 'Add place')}</button>
          {(draft.id > 0 || draft.name || draft.lat !== null) && <button className="btn sec" onClick={() => { setDraft(EMPTY); setErr(''); }}>{t('Cancel')}</button>}
        </div>
      </div>
      <div className="box">
        <h2 style={{ marginTop: 0 }}>{t('Places on the list')} <span className="meta">({places.length})</span></h2>
        {places.length === 0 && <p className="meta">{t('No places yet. Members can still type a place.')}</p>}
        {places.map(p => (
          <div key={p.id} className="sw">
            <span><b>{t(p.name)}</b><div className="meta">{p.lat !== null ? `${p.lat.toFixed(5)}, ${p.lng!.toFixed(5)}` : t('No pin')}</div></span>
            <span style={{ display: 'flex', gap: 6 }}>
              <button className="btn sec" onClick={() => setDraft({ id: p.id, name: p.name, lat: p.lat, lng: p.lng })}>{t('Edit')}</button>
              <button className="btn bad" disabled={busy} onClick={() => remove(p)}>{t('Remove')}</button>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

'use client';

import { useMemo } from 'react';
import type { Place } from '@/lib/types';
import { GoogleMap, type MapMarker } from './GoogleMap';
import { useT } from './Providers';

export type PlaceValue = { place: string; lat: number | null; lng: number | null };

/**
 * Choose one of the organization's places, or type another one, and (optionally) drop a pin on the map.
 * With `formNames`, hidden inputs place / lat / lng are rendered for a plain <form>.
 */
export function PlacePicker({ places, value, onChange, formNames = false }: {
  places: Place[]; value: PlaceValue; onChange: (v: PlaceValue) => void; formNames?: boolean;
}) {
  const t = useT();
  const known = places.find(p => p.name === value.place);
  const markers = useMemo<MapMarker[]>(() => places.filter(p => p.lat !== null && p.lng !== null)
    .map(p => ({ id: p.id, lat: p.lat!, lng: p.lng!, title: t(p.name) })), [places, t]);
  const picked = value.lat !== null && value.lng !== null ? { lat: value.lat, lng: value.lng } : null;

  return (
    <div>
      {places.length > 0 && (
        <div className="chips" style={{ marginTop: 0 }}>
          {places.map(p => (
            <button key={p.id} type="button" className={value.place === p.name ? 'on' : ''}
              onClick={() => onChange({ place: p.name, lat: p.lat, lng: p.lng })}>{t(p.name)}</button>
          ))}
        </div>
      )}
      <div className="field">
        <label>{t(places.length ? 'Or type another place' : 'Place')}</label>
        <input value={known ? '' : value.place} placeholder={t('e.g. Bus stop in front of the school')} maxLength={100}
          onChange={e => onChange({ place: e.target.value, lat: value.lat, lng: value.lng })} />
      </div>
      <p className="meta" style={{ margin: '0 0 8px' }}>{t('Tap the map to mark the exact spot (optional).')}</p>
      <GoogleMap markers={markers} picked={picked} onPick={p => onChange({ place: value.place, lat: p.lat, lng: p.lng })} height={300} />
      {picked && (
        <p className="meta" style={{ marginTop: -6 }}>
          {t('Pin: {lat}, {lng}', { lat: picked.lat.toFixed(5), lng: picked.lng.toFixed(5) })}{' '}
          <button type="button" className="linkbtn" onClick={() => onChange({ ...value, lat: null, lng: null })}>{t('Remove pin')}</button>
        </p>
      )}
      {formNames && (
        <>
          <input type="hidden" name="place" value={value.place} />
          <input type="hidden" name="lat" value={value.lat ?? ''} />
          <input type="hidden" name="lng" value={value.lng ?? ''} />
        </>
      )}
    </div>
  );
}

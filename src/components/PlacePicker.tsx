'use client';

import { useMemo } from 'react';
import type { Place } from '@/lib/types';
import { FloorPlan } from './FloorPlan';
import { MapView, type MapMarker } from './MapView';
import { useT } from './Providers';

export type PlaceValue = { place: string; lat: number | null; lng: number | null };

/**
 * Tap a room on the campus floor plan, or type another place, and (optionally) drop a pin on the street map.
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
        <>
          <p className="meta" style={{ margin: '0 0 8px' }}>{t('Tap the room where it was lost or found.')}</p>
          <FloorPlan places={places.map(p => p.name)} selected={value.place}
            onPick={name => { const p = places.find(x => x.name === name)!; onChange({ place: p.name, lat: p.lat, lng: p.lng }); }} />
          {known && <p className="meta" style={{ margin: '8px 0 0' }}>{t('Selected: {place}', { place: t(known.name) })}</p>}
        </>
      )}
      <div className="field" style={{ marginTop: 12 }}>
        <label>{t(places.length ? 'Or type another place' : 'Place')}</label>
        <input value={known ? '' : value.place} placeholder={t('e.g. Bus stop in front of the school')} maxLength={100}
          onChange={e => onChange({ place: e.target.value, lat: value.lat, lng: value.lng })} />
      </div>
      <details className="mapfold" open={!!picked && !known}>
        <summary>{t('Outside the buildings? Mark the spot on the map (optional)')}</summary>
        <MapView markers={markers} picked={picked} onPick={p => onChange({ place: value.place, lat: p.lat, lng: p.lng })} height={300} />
        {picked && (
          <p className="meta" style={{ marginTop: -6 }}>
            {t('Pin: {lat}, {lng}', { lat: picked.lat.toFixed(5), lng: picked.lng.toFixed(5) })}{' '}
            <button type="button" className="linkbtn" onClick={() => onChange({ ...value, lat: null, lng: null })}>{t('Remove pin')}</button>
          </p>
        )}
      </details>
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

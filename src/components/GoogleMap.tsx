'use client';

// Google Maps (Maps JavaScript API). Needs NEXT_PUBLIC_GOOGLE_MAPS_API_KEY; without it a setup note is shown.
// Markers use AdvancedMarkerElement, which needs a Map ID (NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID; Google's DEMO_MAP_ID works for testing).
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useLang, useT } from './Providers';

const KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? '';
const MAP_ID = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID || 'DEMO_MAP_ID';
/** Used when there is nothing to centre on (Yokohama). */
const FALLBACK = { lat: 35.4658, lng: 139.6223 };

export type MapMarker = { id: string | number; lat: number; lng: number; title: string; sub?: string; href?: string; count?: number; accent?: boolean };

let loading: Promise<any> | null = null;
function loadMaps(lang: string): Promise<any> {
  const w = window as any;
  if (w.google?.maps?.importLibrary) return Promise.resolve(w.google.maps);
  if (loading) return loading;
  loading = new Promise((resolve, reject) => {
    w.__lfMapsReady = () => resolve(w.google.maps);
    const s = document.createElement('script');
    s.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(KEY)}&v=weekly&loading=async&language=${lang}&region=JP&callback=__lfMapsReady`;
    s.async = true;
    s.onerror = () => { loading = null; reject(new Error('Google Maps could not be loaded')); };
    document.head.appendChild(s);
  });
  return loading;
}

type Props = {
  markers?: MapMarker[];
  /** A pin the user is placing (report form, place editor). */
  picked?: { lat: number; lng: number } | null;
  onPick?: (p: { lat: number; lng: number }) => void;
  /** 'heat' draws circles sized by count (hotspots). */
  mode?: 'pins' | 'heat';
  height?: number;
  zoom?: number;
};

export function GoogleMap({ markers = [], picked = null, onPick, mode = 'pins', height = 340, zoom = 17 }: Props) {
  const t = useT();
  const lang = useLang();
  const router = useRouter();
  const box = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);
  const drawn = useRef<any[]>([]);
  const pickRef = useRef<any>(null);
  const info = useRef<any>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const onPickRef = useRef(onPick);
  onPickRef.current = onPick;

  // Create the map once.
  useEffect(() => {
    if (!KEY || !box.current) return;
    let cancelled = false;
    (window as any).gm_authFailure = () => setError('Google Maps refused the API key. Check the key and its allowed websites.');
    loadMaps(lang).then(async g => {
      const [{ Map, InfoWindow }] = await Promise.all([g.importLibrary('maps'), g.importLibrary('marker')]);
      if (cancelled || !box.current) return;
      const start = picked ?? markers[0] ?? FALLBACK;
      map.current = new Map(box.current, {
        center: { lat: start.lat, lng: start.lng }, zoom, mapId: MAP_ID,
        streetViewControl: false, mapTypeControl: false, fullscreenControl: true, clickableIcons: false,
      });
      info.current = new InfoWindow();
      map.current.addListener('click', (e: any) => {
        if (onPickRef.current && e.latLng) onPickRef.current({ lat: e.latLng.lat(), lng: e.latLng.lng() });
      });
      setReady(true);
    }).catch(e => setError(e.message));
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Draw markers / circles whenever they change.
  useEffect(() => {
    const g = (window as any).google?.maps;
    if (!ready || !g || !map.current) return;
    drawn.current.forEach(d => (d.setMap ? d.setMap(null) : (d.map = null)));
    drawn.current = [];
    const max = Math.max(1, ...markers.map(m => m.count ?? 1));
    for (const m of markers) {
      if (mode === 'heat') {
        const share = (m.count ?? 1) / max;
        drawn.current.push(new g.Circle({
          map: map.current, center: { lat: m.lat, lng: m.lng }, radius: 12 + 38 * share,
          strokeColor: '#dc2626', strokeWeight: 1, fillColor: '#dc2626', fillOpacity: 0.15 + 0.45 * share, clickable: false,
        }));
      }
      const pin = new g.marker.PinElement({
        background: mode === 'heat' ? '#dc2626' : m.accent ? '#d97706' : '#2563eb', borderColor: '#ffffff', glyphColor: '#ffffff',
        glyph: m.count && m.count > 1 ? String(m.count) : undefined, scale: m.accent ? 1.15 : 1,
      });
      const mk = new g.marker.AdvancedMarkerElement({ map: map.current, position: { lat: m.lat, lng: m.lng }, title: m.title, content: pin.element, gmpClickable: true });
      mk.addListener('click', () => {
        // Built with textContent, never HTML from the data.
        const el = document.createElement('div');
        el.style.cssText = 'font:14px/1.4 system-ui;max-width:220px';
        const b = document.createElement('b'); b.textContent = m.title; el.appendChild(b);
        if (m.sub) { const d = document.createElement('div'); d.textContent = m.sub; d.style.color = '#64748b'; el.appendChild(d); }
        if (m.href) {
          const a = document.createElement('a'); a.textContent = t('Details') + ' →'; a.href = m.href; a.style.cssText = 'display:inline-block;margin-top:6px;color:#2563eb';
          a.addEventListener('click', ev => { ev.preventDefault(); router.push(m.href!); });
          el.appendChild(a);
        }
        info.current.setContent(el);
        info.current.open({ map: map.current, anchor: mk });
      });
      drawn.current.push(mk);
    }
    if (markers.length > 1 && !picked) {
      const bounds = new g.LatLngBounds();
      markers.forEach(m => bounds.extend({ lat: m.lat, lng: m.lng }));
      map.current.fitBounds(bounds, 48);
    } else if (markers.length === 1 && !picked) {
      map.current.setCenter({ lat: markers[0].lat, lng: markers[0].lng });
    }
  }, [ready, markers, mode, picked, router, t]);

  // The pin being placed.
  useEffect(() => {
    const g = (window as any).google?.maps;
    if (!ready || !g || !map.current) return;
    if (pickRef.current) pickRef.current.map = null;
    pickRef.current = null;
    if (picked) {
      const pin = new g.marker.PinElement({ background: '#d97706', borderColor: '#ffffff', glyphColor: '#ffffff', scale: 1.2 });
      pickRef.current = new g.marker.AdvancedMarkerElement({ map: map.current, position: picked, content: pin.element, title: t('Selected place') });
      map.current.panTo(picked);
    }
  }, [ready, picked, t]);

  if (!KEY) {
    return (
      <div className="mapbox mapnote" style={{ height }}>
        <b>{t('Google Maps is not set up yet')}</b>
        <span className="meta">{t('Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to .env.local and restart the app. The lists below still work.')}</span>
      </div>
    );
  }
  return (
    <div className="mapbox" style={{ padding: 0, overflow: 'hidden' }}>
      {error && <div className="mapnote" style={{ height }}><b>{t('The map could not be shown')}</b><span className="meta">{t(error)}</span></div>}
      <div ref={box} style={{ height, width: '100%', display: error ? 'none' : 'block' }} aria-label={t('Map')} />
    </div>
  );
}

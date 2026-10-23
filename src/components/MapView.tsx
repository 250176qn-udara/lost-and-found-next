'use client';

// Street map with OpenStreetMap tiles (Leaflet). Free: no API key, no billing. Inside the buildings, use FloorPlan.
import 'leaflet/dist/leaflet.css';
import type * as Leaflet from 'leaflet';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useT } from './Providers';

/** Used when there is nothing to centre on (YSE campus). */
const FALLBACK = { lat: 35.463823, lng: 139.513032 };

export type MapMarker = { id: string | number; lat: number; lng: number; title: string; sub?: string; href?: string; count?: number; accent?: boolean };

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

/** A round pin drawn with CSS (no image files to load). */
function pinIcon(L: typeof Leaflet, kind: 'blue' | 'orange' | 'red', label?: string) {
  return L.divIcon({
    className: 'lfpin-wrap',
    html: `<span class="lfpin ${kind}">${label ? String(label).replace(/[^0-9+]/g, '') : ''}</span>`,
    iconSize: [26, 26], iconAnchor: [13, 26], popupAnchor: [0, -24],
  });
}

export function MapView({ markers = [], picked = null, onPick, mode = 'pins', height = 340, zoom = 17 }: Props) {
  const t = useT();
  const router = useRouter();
  const box = useRef<HTMLDivElement>(null);
  const lib = useRef<typeof Leaflet | null>(null);
  const map = useRef<Leaflet.Map | null>(null);
  const layer = useRef<Leaflet.LayerGroup | null>(null);
  const pickLayer = useRef<Leaflet.Marker | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const onPickRef = useRef(onPick);
  onPickRef.current = onPick;

  // Create the map once (Leaflet needs the browser, so it is loaded here).
  useEffect(() => {
    let cancelled = false;
    import('leaflet').then(mod => {
      const L = (mod.default ?? mod) as typeof Leaflet;
      if (cancelled || !box.current || map.current) return;
      lib.current = L;
      const start = picked ?? markers[0] ?? FALLBACK;
      const m = L.map(box.current, { center: [start.lat, start.lng], zoom, scrollWheelZoom: false });
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19, subdomains: 'abc',
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(m);
      m.on('click', e => onPickRef.current?.({ lat: e.latlng.lat, lng: e.latlng.lng }));
      layer.current = L.layerGroup().addTo(m);
      map.current = m;
      setReady(true);
    }).catch(() => setError('The map could not be loaded.'));
    return () => {
      cancelled = true;
      map.current?.remove();
      map.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Draw markers / circles whenever they change.
  useEffect(() => {
    const L = lib.current, m = map.current, g = layer.current;
    if (!ready || !L || !m || !g) return;
    g.clearLayers();
    const max = Math.max(1, ...markers.map(x => x.count ?? 1));
    for (const x of markers) {
      if (mode === 'heat') {
        const share = (x.count ?? 1) / max;
        L.circle([x.lat, x.lng], { radius: 12 + 38 * share, color: '#dc2626', weight: 1, fillColor: '#dc2626', fillOpacity: 0.15 + 0.45 * share, interactive: false }).addTo(g);
      }
      const mk = L.marker([x.lat, x.lng], {
        icon: pinIcon(L, mode === 'heat' ? 'red' : x.accent ? 'orange' : 'blue', x.count && x.count > 1 ? String(x.count) : undefined),
        title: x.title,
      }).addTo(g);
      // Built with textContent, never HTML from the data.
      const el = document.createElement('div');
      el.style.cssText = 'font:14px/1.4 system-ui;max-width:220px';
      const b = document.createElement('b'); b.textContent = x.title; el.appendChild(b);
      if (x.sub) { const d = document.createElement('div'); d.textContent = x.sub; d.style.color = '#64748b'; el.appendChild(d); }
      if (x.href) {
        const a = document.createElement('a'); a.textContent = t('Details') + ' →'; a.href = x.href; a.style.cssText = 'display:inline-block;margin-top:6px';
        a.addEventListener('click', ev => { ev.preventDefault(); router.push(x.href!); });
        el.appendChild(a);
      }
      mk.bindPopup(el);
    }
    if (picked) return;
    if (markers.length > 1) m.fitBounds(L.latLngBounds(markers.map(x => [x.lat, x.lng] as [number, number])), { padding: [40, 40], maxZoom: 18 });
    else if (markers.length === 1) m.setView([markers[0].lat, markers[0].lng], zoom);
  }, [ready, markers, mode, picked, router, t, zoom]);

  // The pin being placed.
  useEffect(() => {
    const L = lib.current, m = map.current;
    if (!ready || !L || !m) return;
    pickLayer.current?.remove();
    pickLayer.current = null;
    if (picked) {
      pickLayer.current = L.marker([picked.lat, picked.lng], { icon: pinIcon(L, 'orange'), title: t('Selected place') }).addTo(m);
      m.panTo([picked.lat, picked.lng]);
    }
  }, [ready, picked, t]);

  return (
    <div className="mapbox" style={{ padding: 0, overflow: 'hidden' }}>
      {error && <div className="mapnote" style={{ height }}><b>{t('The map could not be shown')}</b><span className="meta">{t(error)}</span></div>}
      <div ref={box} style={{ height, width: '100%', display: error ? 'none' : 'block' }} aria-label={t('Map')} />
    </div>
  );
}

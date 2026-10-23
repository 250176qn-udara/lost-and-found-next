'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useT } from './Providers';
import { floorRank, NO_FLOOR, parsePlace as parse } from '@/lib/places';

// Campus floor plan, drawn from the place names: "Bldg A · Lab 2F" -> building A, floor 2F, room "Lab".
// Admins add rooms under Settings → Places (name them "Bldg A · Room 2F"). Places without a building go under "Other".

export type PlaceCount = { n: number; /** shown under the number, e.g. "2 found · 1 lost" */ sub?: string };

type Room = { name: string; label: string; floor: string };
type Building = { key: string; floors: { floor: string; rooms: Room[] }[] };

export function FloorPlan({ places, counts = {}, selected, onPick, linkBase, heat = false }: {
  /** Place names to draw (the organization's places plus any typed ones). */
  places: string[];
  counts?: Record<string, PlaceCount>;
  selected?: string | null;
  /** Picking a room (report form). */
  onPick?: (place: string) => void;
  /** Rooms become links: linkBase + encoded place name. */
  linkBase?: string;
  /** Colour rooms by count (hotspots). */
  heat?: boolean;
}) {
  const t = useT();
  const buildings = useMemo<Building[]>(() => {
    const by = new Map<string, Map<string, Room[]>>();
    for (const name of [...new Set(places)]) {
      const p = parse(name, t(name));
      const key = p.building || 'Other';
      if (!by.has(key)) by.set(key, new Map());
      const floors = by.get(key)!;
      if (!floors.has(p.floor)) floors.set(p.floor, []);
      floors.get(p.floor)!.push({ name, label: p.label, floor: p.floor });
    }
    return [...by.entries()]
      .sort(([a], [b]) => (a === 'Other' ? 1 : b === 'Other' ? -1 : a.localeCompare(b)))
      .map(([key, floors]) => ({
        key,
        floors: [...floors.entries()].sort(([a], [b]) => floorRank(b) - floorRank(a))
          .map(([floor, rooms]) => ({ floor, rooms: rooms.sort((x, y) => x.label.localeCompare(y.label)) })),
      }));
  }, [places, t]);
  const firstWithSelected = buildings.find(b => b.floors.some(f => f.rooms.some(r => r.name === selected)))?.key;
  const [tab, setTab] = useState<string | null>(null);
  const current = buildings.find(b => b.key === (tab ?? firstWithSelected)) ?? buildings[0];
  const max = Math.max(1, ...Object.values(counts).map(c => c.n));

  if (!current) return <div className="box meta">{t('No places yet. Admins add rooms under Settings → Places.')}</div>;

  const room = (r: Room) => {
    const c = counts[r.name];
    const share = c ? c.n / max : 0;
    const cls = 'fp-room' + (r.name === selected ? ' on' : '') + (c?.n ? ' has' : '') + (heat && c?.n ? (share > 0.7 ? ' hot3' : share > 0.4 ? ' hot2' : ' hot1') : '');
    const body = (
      <>
        <span className="fp-label">{r.label}</span>
        {c?.n ? <span className="fp-n">{c.n}</span> : null}
        {c?.sub && <span className="fp-sub">{c.sub}</span>}
      </>
    );
    if (onPick) return <button key={r.name} type="button" className={cls} aria-pressed={r.name === selected} title={t(r.name)} onClick={() => onPick(r.name)}>{body}</button>;
    if (linkBase) return <Link key={r.name} className={cls} title={t(r.name)} href={linkBase + encodeURIComponent(r.name)}>{body}</Link>;
    return <div key={r.name} className={cls} title={t(r.name)}>{body}</div>;
  };

  return (
    <div className="fp">
      {buildings.length > 1 && (
        <div className="seg" style={{ margin: '0 0 10px' }}>
          {buildings.map(b => (
            <button key={b.key} type="button" className={b.key === current.key ? 'on' : ''} onClick={() => setTab(b.key)}>
              {b.key === 'Other' ? t('Other places') : t('Bldg {b}', { b: b.key })}
            </button>
          ))}
        </div>
      )}
      <div className="fp-building">
        {current.floors.map(f => (
          <div className={'fp-floor' + (f.floor === NO_FLOOR ? ' nofloor' : '')} key={f.floor || 'none'}>
            <div className="fp-fl">{f.floor || (current.key === 'Other' ? '' : t('Floor not set'))}</div>
            <div className="fp-rooms">{f.rooms.map(room)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

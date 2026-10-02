// Campus map drawn as SVG. Zones are the places in PLACES. No hooks, so it works in Server and Client Components.
import type { T } from '@/lib/i18n';

const ZONES = [
  { id: 'Library', x: 30, y: 30, w: 190, h: 120 },
  { id: 'Gym', x: 250, y: 30, w: 170, h: 120 },
  { id: 'Cafeteria', x: 450, y: 30, w: 160, h: 120 },
  { id: 'Room 302', x: 30, y: 190, w: 190, h: 130 },
  { id: 'Entrance', x: 250, y: 220, w: 360, h: 100 },
];

type Props = {
  counts: Record<string, number>;
  t: T;
  /** 'pins' shows a numbered pin per zone, 'heat' shades zones red by count. */
  mode?: 'pins' | 'heat';
  selected?: string;
  /** Link for a zone (Server Components) ... */
  linkFor?: (zone: string) => string;
  /** ... or a click handler (Client Components). */
  onPick?: (zone: string) => void;
};

export function CampusMap({ counts, t, mode = 'pins', selected, linkFor, onPick }: Props) {
  const max = Math.max(1, ...Object.values(counts));
  return (
    <div className="mapbox">
      <svg viewBox="0 0 640 350" role="img" aria-label={t('Campus map')}>
        {ZONES.map(z => {
          const n = counts[z.id] || 0;
          const fill = mode === 'heat' ? `rgba(220,38,38,${(0.08 + (0.6 * n) / max).toFixed(2)})` : selected === z.id ? '#dbeafe' : '#ffffff';
          const cx = z.x + z.w / 2, cy = z.y + z.h / 2;
          const body = (
            <>
              <rect x={z.x} y={z.y} width={z.w} height={z.h} rx={12} fill={fill} stroke="#cbd5e1" strokeWidth={2} />
              <text x={z.x + 12} y={z.y + 22} fontSize={14} fontWeight={700} fill="#334155">{t(z.id)}</text>
              {n > 0 && (
                <>
                  <circle cx={cx} cy={cy + 8} r={17} fill={mode === 'heat' ? '#dc2626' : '#2563eb'} />
                  <text x={cx} y={cy + 14} fontSize={15} fontWeight={700} fill="#fff" textAnchor="middle">{n}</text>
                </>
              )}
            </>
          );
          return linkFor
            ? <a key={z.id} href={linkFor(z.id)} className="zone">{body}</a>
            : <g key={z.id} className="zone" onClick={onPick ? () => onPick(z.id) : undefined}>{body}</g>;
        })}
      </svg>
    </div>
  );
}

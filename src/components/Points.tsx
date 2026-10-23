// Thank-you points: the member's total, level and progress, how to earn points, and the "Top helpers" ranking. No hooks.
import Link from 'next/link';
import { POINT_LEVELS, POINT_REASONS, POINT_RULES, type PointReason } from '@/lib/constants';
import type { T } from '@/lib/i18n';
import type { PointsSummary } from '@/lib/points';
import { CountUp } from './Animated';

export function PointsCard({ p, t, compact = false }: { p: PointsSummary; t: T; compact?: boolean }) {
  return (
    <div className="box pointscard">
      <div className="pc-top">
        <span className="pc-badge" aria-hidden="true">{p.level.icon}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <span className="meta">{t('Thank-you points')}</span>
          <b className="pc-total"><CountUp value={p.total} /></b>
          <span className="pc-level">{t(p.level.name)}</span>
        </div>
      </div>
      {p.next ? (
        <>
          <div className="pc-bar" role="progressbar" aria-valuenow={p.progress} aria-valuemin={0} aria-valuemax={100}><i style={{ width: `${p.progress}%` }} /></div>
          <span className="meta">{t('{n} more points to {level}', { n: p.next.min - p.total, level: t(p.next.name) })}</span>
        </>
      ) : <span className="meta">{t('Highest level reached. Thank you!')}</span>}
      {compact && <Link href="/my-items?tab=points" className="pc-link">{t('How to earn points')} →</Link>}
    </div>
  );
}

export function Ranking({ rows, meId, t }: { rows: { userId: number; name: string; total: number; level: { icon: string } }[]; meId: number; t: T }) {
  if (!rows.length) return <div className="box meta">{t('No points yet. Help someone get their item back to be the first!')}</div>;
  return (
    <ol className="ranking">
      {rows.map((r, i) => (
        <li key={r.userId} className={r.userId === meId ? 'me' : ''} style={{ animationDelay: `${i * 0.06}s` }}>
          <span className={'rk rk' + (i + 1)}>{i + 1}</span>
          <span className="rk-name">{r.level.icon} {r.name}{r.userId === meId && <em> ({t('you')})</em>}</span>
          <b>{r.total}</b>
        </li>
      ))}
    </ol>
  );
}

/** How points are earned, and the levels. */
export function PointRules({ t }: { t: T }) {
  const earn: PointReason[] = ['handed_in', 'on_time', 'returned', 'thanks', 'wrote_thanks'];
  return (
    <div className="cols even" style={{ marginTop: 16 }}>
      <div className="box">
        <h3 style={{ marginTop: 0 }}>{t('How to earn points')}</h3>
        {earn.map(r => (
          <div className="kv" key={r}><span>{t(POINT_REASONS[r])}</span><b>{r === 'thanks' ? t('up to +50') : `+${POINT_RULES[r]}`}</b></div>
        ))}
        <p className="meta" style={{ marginBottom: 0 }}>{t('Points are given when staff confirm each step. They cannot be bought or exchanged for money or goods.')}</p>
      </div>
      <div className="box">
        <h3 style={{ marginTop: 0 }}>{t('Levels')}</h3>
        {POINT_LEVELS.map(l => <div className="kv" key={l.name}><span>{l.icon} {t(l.name)}</span><b>{l.min}+</b></div>)}
      </div>
    </div>
  );
}

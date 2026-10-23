// Pastel dashboard pieces shared by the member dashboard and the admin overview. No hooks.
import Link from 'next/link';
import type { T } from '@/lib/i18n';
import type { MatchPair } from '@/lib/types';
import { scoreClass, scoreMatch } from '@/lib/match';
import { CountUp } from './Animated';
import { Icon } from './Icon';
import { placeDate } from './ui';

/** Four pastel statistic cards from real counts. */
export function StatCards({ c, t }: { c: { lost: number; found: number; returned: number; unclaimed: number }; t: T }) {
  const cards = [
    { tone: 'peach', icon: '🔎', n: c.lost, label: 'Lost items reported', href: '/my-items' },
    { tone: 'mint', icon: '🎒', n: c.found, label: 'Found items posted', href: '/browse' },
    { tone: 'yellow', icon: '💝', n: c.returned, label: 'Returned to owners', href: '/wall' },
    { tone: 'blue', icon: '📦', n: c.unclaimed, label: 'Waiting for their owner', href: '/browse' },
  ];
  return (
    <div className="statrow">
      {cards.map((k, i) => (
        <Link key={k.label} href={k.href} className={'statcard ' + k.tone} style={{ animationDelay: `${i * 0.07}s` }}>
          <span className="sc-icon" aria-hidden="true">{k.icon}</span>
          <b><CountUp value={k.n} delay={i * 70} /></b>
          <span>{t(k.label)}</span>
        </Link>
      ))}
    </div>
  );
}

/** Suggested matches (rules or Gemini). The score is the one the system calculated. */
export function SuggestedMatches({ pairs, t, reviewHref, showOwner = false }: {
  pairs: MatchPair[]; t: T; reviewHref: string; showOwner?: boolean;
}) {
  return (
    <>
      {pairs.map((p, i) => {
        const { score, ai } = scoreMatch({ place: p.lostPlace, date: p.lostDate, lat: p.lostLat, lng: p.lostLng, category: p.lostCategory },
          { place: p.foundPlace, date: p.foundDate, lat: p.foundLat, lng: p.foundLng, category: p.foundCategory }, p.aiScore);
        return (
          <div className="matchrow" key={p.lostId} style={{ animationDelay: `${i * 0.06}s` }}>
            <div className="side-a"><span className="meta">{t('Lost report')}{showOwner ? ` · ${p.ownerName}` : ''}</span><b>{p.lostTitle}</b><span className="meta">{placeDate(p.lostPlace, p.lostDate, t)}</span></div>
            <span className="link" aria-hidden="true">⇄</span>
            <div className="side-b"><span className="meta">{t('Found item')}</span><b>{p.foundTitle}</b><span className="meta">{placeDate(p.foundPlace, p.foundDate, t)}</span></div>
            <div className="scorebox">
              <div className={'score ' + scoreClass(score)}>{score}%</div>
              {ai && <span className="pill ai"><Icon name="spark" size={12} /> {t('Checked by AI')}</span>}
              <div style={{ marginTop: 6 }}><Link className="btn sec" href={reviewHref}>{t('Review match')}</Link></div>
            </div>
          </div>
        );
      })}
    </>
  );
}

import Link from 'next/link';
import { requirePage } from '@/lib/auth';
import { getT } from '@/lib/i18n-server';
import { getWall, helperOfMonth, lastMonth, returnedThisMonth } from '@/lib/community';
import { CountUp } from '@/components/Animated';
import { ClapButton } from '@/components/Community';
import { CategoryArt } from '@/components/Icon';
import { Empty, Illustration } from '@/components/Illustration';
import { when } from '@/components/ui';

/** Thank-you wall: anonymous stories of items that went back to their owners, this month's count and Helper of the month. */
export default async function WallPage() {
  const { user } = await requirePage({ membership: true });
  const orgId = user.organizationId!;
  const month = lastMonth();
  const [t, stories, count, helper] = await Promise.all([getT(), getWall(orgId, user.id), returnedThisMonth(orgId), helperOfMonth(orgId, month)]);
  const where = (b: string) => (b === 'Other' ? t('on campus') : t('in Bldg {b}', { b }));

  return (
    <>
      <div className="hero dash-hero wall-hero">
        <div className="dash-hero-text">
          <span className="hero-kicker">{t('Thank-you wall')}</span>
          <h1><CountUp value={count} /> {t(count === 1 ? 'item went back to its owner this month' : 'items went back to their owners this month')} ❤️</h1>
          <p>{t('Every story here is a small act of kindness by someone in our school. Tap 👏 to say thanks too.')}</p>
        </div>
        <Illustration name="done" size={170} className="hero-art" />
      </div>

      {helper && (
        <div className="box hotm">
          <span className="hotm-medal" aria-hidden="true">🏅</span>
          <div style={{ flex: 1, minWidth: 200 }}>
            <span className="meta">{t('Helper of the month · {month}', { month })}</span>
            <b className="hotm-name">{helper.name}</b>
            <span className="meta">{t(helper.returns === 1 ? '{n} points · 1 item returned' : '{n} points · {r} items returned', { n: helper.total, r: helper.returns })}</span>
          </div>
          <Link className="btn sec" href={`/certificate/${month}`}>{t('See the certificate')}</Link>
        </div>
      )}

      <h2>{t('Recent stories')}</h2>
      {stories.length ? (
        <div className="wall">
          {stories.map((s, i) => (
            <article key={s.id} className={'story' + (s.mine ? ' mine' : '')} style={{ animationDelay: `${Math.min(i, 10) * 0.05}s` }}>
              <CategoryArt category={s.category} />
              <div className="story-body">
                <p>{t('A {category} went back to its owner {where}, thanks to a {level}.', { category: t(s.category).toLowerCase(), where: where(s.building), level: `${s.finderLevel.icon} ${t(s.finderLevel.name)}` })}</p>
                <div className="story-foot">
                  <span className="meta">{when(s.at)}</span>
                  {s.points > 0 && <span className="letter-points small">⭐ +{s.points}</span>}
                  {s.mine && <span className="badge">{t('Your story')}</span>}
                  <span className="grow" />
                  <ClapButton id={s.id} count={s.claps} clapped={s.clapped} />
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : <Empty art="done" title={t('No stories yet.')} text={t('When an owner sends a thank-you letter and agrees to share it, the story appears here.')} />}
    </>
  );
}

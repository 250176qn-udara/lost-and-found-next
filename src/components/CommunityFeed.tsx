'use client';

import Link from 'next/link';
import { useState } from 'react';
import type { FeedPost } from '@/lib/community';
import { CategoryArt, Icon } from './Icon';
import { useT } from './Providers';
import { placeDate, when } from './ui';

type Filter = 'all' | 'lost' | 'found';

/** Every new lost or found post in the community, on everyone's dashboard. Filter by kind; each card opens the post. */
export function CommunityFeed({ posts, staff = false }: { posts: FeedPost[]; staff?: boolean }) {
  const t = useT();
  const [filter, setFilter] = useState<Filter>('all');
  const shown = posts.filter(p => filter === 'all' || p.kind === filter);
  const count = (k: Filter) => (k === 'all' ? posts.length : posts.filter(p => p.kind === k).length);
  // Where a card leads: staff see the full record; members see found items, lost posts in "Have you seen these?", and their own posts in My items.
  const open = (p: FeedPost) => staff ? `/items/${p.id}`
    : p.mine ? (p.kind === 'found' ? '/my-items?tab=found' : '/my-items')
    : p.kind === 'found' ? `/items/${p.id}` : `/browse?view=help#i${p.id}`;

  return (
    <section className="feed" aria-labelledby="feed-title">
      <div className="feed-head">
        <div>
          <h2 id="feed-title">{t('Community posts')}</h2>
          <p className="meta">{t('What people in your community lost or found recently. Seen something? Tell them.')}</p>
        </div>
        <div className="seg" role="tablist" style={{ margin: 0 }}>
          {(['all', 'lost', 'found'] as Filter[]).map(k => (
            <button key={k} role="tab" aria-selected={filter === k} className={filter === k ? 'on' : ''} onClick={() => setFilter(k)}>
              {t(k === 'all' ? 'All' : k === 'lost' ? 'Lost' : 'Found')} <span className="segcount">{count(k)}</span>
            </button>
          ))}
        </div>
      </div>

      {shown.length ? (
        <div className="feed-grid">
          {shown.map(p => (
            <Link key={p.id} href={open(p)} className={'box feed-card ' + p.kind}>
              {p.hasPhoto
                ? <div className="thumb"><img src={`/api/items/${p.id}/photo`} alt="" /><span className="cat">{t(p.category)}</span></div>
                : <CategoryArt category={p.category} big />}
              <div className="feed-tags">
                <span className={'kindbadge ' + p.kind}>{t(p.kind === 'lost' ? 'Lost' : 'Found')}</span>
                {p.isNew && <span className="feed-new">{t('New')}</span>}
                {p.mine && <span className="pill">{t('Your post')}</span>}
              </div>
              <b className="feed-title">{p.title}</b>
              <div className="itemmeta">
                <span><Icon name="pin" size={14} />{placeDate(p.place, p.date, t)}</span>
                <span><Icon name="clock" size={14} />{t('Posted {time}', { time: when(p.createdAt) })}</span>
              </div>
              <span className="feed-go">
                {t(p.kind === 'found' ? (p.mine || staff ? 'Open' : 'Is it yours?') : (p.mine || staff ? 'Open' : 'Have you seen it?'))}
                <Icon name="chevron" size={15} />
              </span>
            </Link>
          ))}
        </div>
      ) : (
        <div className="box meta">{t(filter === 'lost' ? 'No lost posts right now.' : filter === 'found' ? 'No found posts right now.' : 'No posts yet. When someone reports a lost or found item, it shows here.')}</div>
      )}

      {!staff && (
        <div className="btnrow" style={{ marginTop: 14 }}>
          <Link className="btn sec" href="/browse">{t('See all found items')}</Link>
          <Link className="btn sec" href="/browse?view=help">{t('See all lost posts')}</Link>
        </div>
      )}
    </section>
  );
}

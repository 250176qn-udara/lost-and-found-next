// Journey bar (numbered steps: done / now / next) and the "next step" box with whose turn it is.
// No hooks, so it works in Server and Client Components.
import Link from 'next/link';
import type { ReactNode } from 'react';
import type { T } from '@/lib/i18n';
import { JOURNEY, type Journey, type Who } from '@/lib/journey';
import { Icon } from './Icon';

const WHO: Record<Who, [label: string, icon: string]> = {
  you: ['Your turn', 'hand'], staff: ['Staff', 'desk'], finder: ['The finder', 'search'],
  owner: ['The owner', 'user'], system: ['Automatic', 'clock'], done: ['Done', 'check'],
};

export function JourneyBar({ done, t, compact = false }: { done: boolean[]; t: T; compact?: boolean }) {
  const now = done.findIndex(d => !d);
  return (
    <ol className={'journey' + (compact ? ' compact' : '')} aria-label={t('Progress')}>
      {JOURNEY.map((s, i) => (
        <li key={s} className={done[i] ? 'done' : i === now ? 'now' : ''} aria-current={i === now ? 'step' : undefined}>
          <span className="jdot">{done[i] ? <Icon name="check" size={13} /> : i + 1}</span>
          {!compact && <span className="jlbl">{t(s)}</span>}
        </li>
      ))}
    </ol>
  );
}

/** "Next step" box. `children` replaces the link button (e.g. a real action button). */
export function NextStepBox({ j, t, children }: { j: Journey; t: T; children?: ReactNode }) {
  const { next } = j;
  const [label, icon] = WHO[next.who];
  return (
    <div className={'nextstep ' + next.who}>
      <span className="who-chip"><Icon name={icon} size={14} />{t(label)}</span>
      <p>{t(next.text)}</p>
      {children ?? (next.href && next.label && <Link className={next.who === 'you' ? 'btn' : 'btn sec'} href={next.href}>{t(next.label)}</Link>)}
    </div>
  );
}

/** Both together, as used on cards. */
export function JourneyPanel({ j, t, children }: { j: Journey; t: T; children?: ReactNode }) {
  return (
    <div className="jpanel">
      <JourneyBar done={j.done} t={t} />
      <NextStepBox j={j} t={t}>{children}</NextStepBox>
    </div>
  );
}

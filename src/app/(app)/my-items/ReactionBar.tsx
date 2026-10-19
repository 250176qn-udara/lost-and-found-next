'use client';

import { useState, useTransition } from 'react';
import { reactToThanks } from '@/app/actions';
import { THANKS_REACTIONS } from '@/lib/gifts';
import { useT, useToast } from '@/components/Providers';

/** The finder reacts to a thank-you letter. Tap the chosen reaction again to remove it. */
export function ReactionBar({ thanksId, current }: { thanksId: number; current: string | null }) {
  const t = useT();
  const toast = useToast();
  const [picked, setPicked] = useState(current);
  const [busy, start] = useTransition();

  function react(r: string) {
    const next = picked === r ? null : r;
    const before = picked;
    setPicked(next); // show it right away
    start(async () => {
      const res = await reactToThanks(thanksId, next);
      if (!res.ok) { setPicked(before); return toast(res.error); }
      if (next) toast('Your reaction was sent to the owner');
    });
  }

  return (
    <div className="reactions" role="group" aria-label={t('React to this letter')}>
      {THANKS_REACTIONS.map(r => (
        <button key={r} type="button" disabled={busy} aria-pressed={picked === r} className={picked === r ? 'on' : ''}
          title={t(picked === r ? 'Remove reaction' : 'React')} onClick={() => react(r)}>{r}</button>
      ))}
    </div>
  );
}

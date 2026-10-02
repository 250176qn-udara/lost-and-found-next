'use client';

import { useId, useState, type ReactNode } from 'react';
import { Icon } from './Icon';

/**
 * A card whose details slide open when the header is clicked.
 * `head` is always visible; `children` are the details (can be Server Component output).
 */
export function Expandable({ head, children, open: startOpen = false, tone = '' }: { head: ReactNode; children: ReactNode; open?: boolean; tone?: '' | 'done' | 'warn' | 'muted' }) {
  const [open, setOpen] = useState(startOpen);
  const id = useId();
  return (
    <div className={'exp' + (open ? ' open' : '') + (tone ? ' ' + tone : '')}>
      <button type="button" className="exp-head" aria-expanded={open} aria-controls={id} onClick={() => setOpen(!open)}>
        <div className="exp-main">{head}</div>
        <Icon name="chevron" className="exp-chev" />
      </button>
      <div className="exp-body" id={id} role="region">
        <div className="exp-inner">{children}</div>
      </div>
    </div>
  );
}

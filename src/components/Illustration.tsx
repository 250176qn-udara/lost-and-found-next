// Icon badges for empty states, section headings and the "how it works" steps. No hooks.
import type { ReactNode } from 'react';
import { Icon } from './Icon';

// Old illustration names → line icon and tone, so existing call sites keep working.
const ART: Record<string, [icon: string, tone: string]> = {
  empty: ['box', 'slate'], search: ['search', ''], report: ['plus', ''], verify: ['shield', ''], done: ['check', 'green'],
  mascot: ['users', ''], finder: ['search', ''], office: ['desk', ''], campus: ['pie', ''], chart: ['chart', ''],
};

export function Illustration({ name, size = 120, className = '' }: { name: keyof typeof ART | string; size?: number; className?: string }) {
  const [icon, tone] = ART[name] ?? ART.empty;
  // The old drawings were large; a badge reads better at about half that size.
  const box = Math.max(32, Math.round(size * 0.5));
  return (
    <span className={['illus', tone, className].filter(Boolean).join(' ')} style={{ width: box, height: box }} aria-hidden="true">
      <Icon name={icon} size={Math.round(box * 0.5)} />
    </span>
  );
}

/** Empty state: icon, title, text and an optional action. */
export function Empty({ art = 'empty', title, text, children }: { art?: string; title: string; text?: string; children?: ReactNode }) {
  return (
    <div className="empty">
      <Illustration name={art} size={96} />
      <b>{title}</b>
      {text && <p className="meta">{text}</p>}
      {children}
    </div>
  );
}

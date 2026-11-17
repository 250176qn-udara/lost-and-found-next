'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

/** Dialog over the page. Closes on a click outside the box or on Escape.
 *  Rendered at the end of <body> (a portal): inside a card, the card's hover animation would otherwise trap
 *  the fixed overlay inside the card, so the dialog could end up off screen. */
export function Modal({ onClose, children }: { onClose: () => void; children: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  if (!mounted) return null;
  return createPortal(
    <div className="modal on" onClick={e => e.target === e.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true">{children}</div>
    </div>,
    document.body,
  );
}

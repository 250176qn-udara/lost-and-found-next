'use client';

import { useEffect, type ReactNode } from 'react';

/** Dialog over the page. Closes on a click outside the box or on Escape. */
export function Modal({ onClose, children }: { onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="modal on" onClick={e => e.target === e.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true">{children}</div>
    </div>
  );
}

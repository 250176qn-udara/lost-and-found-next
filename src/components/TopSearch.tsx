'use client';

import { useEffect, useRef } from 'react';
import { Icon } from './Icon';

/** Quick search in the top bar. Opens the item list with ?q=…; press "/" anywhere to jump to it. */
export function TopSearch({ action, placeholder }: { action: string; placeholder: string }) {
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (e.key !== '/' || e.ctrlKey || e.metaKey || e.altKey || el.closest('input,textarea,select,[contenteditable="true"]')) return;
      e.preventDefault();
      input.current?.focus();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  return (
    <form className="topsearch" action={action} role="search">
      <Icon name="search" size={17} />
      <input ref={input} name="q" placeholder={placeholder} aria-label={placeholder} autoComplete="off" />
      <kbd aria-hidden="true">/</kbd>
    </form>
  );
}

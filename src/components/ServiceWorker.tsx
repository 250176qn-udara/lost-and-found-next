'use client';

import { useEffect } from 'react';

/** Registers public/sw.js (installable app + offline page). Renders nothing. */
export function ServiceWorker() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => { /* not supported here (e.g. private mode): the app works without it */ });
  }, []);
  return null;
}

'use client';

import { useState, useTransition } from 'react';
import { suggestFromPhoto } from '@/app/actions';
import { MAX_PHOTO_BYTES } from '@/lib/constants';
import type { PhotoGuess } from '@/lib/gemini';
import { Icon } from './Icon';
import { useT } from './Providers';

/** "Take a photo and let AI fill in the form" (Gemini). The user checks the suggestion before sending. */
export function AiPhotoFill({ onResult }: { onResult: (g: PhotoGuess, photo: File) => void }) {
  const t = useT();
  const [err, setErr] = useState('');
  const [done, setDone] = useState(false);
  const [busy, start] = useTransition();
  const pick = (file: File | undefined) => {
    setErr(''); setDone(false);
    if (!file) return;
    if (file.size > MAX_PHOTO_BYTES) return setErr('Photo is too large. Please use a smaller image.');
    const fd = new FormData();
    fd.set('photo', file);
    start(async () => {
      const r = await suggestFromPhoto(fd);
      if (!r.ok) return setErr(r.error);
      onResult(r.guess, file);
      setDone(true);
    });
  };
  return (
    <div className="aifill">
      <div style={{ flex: 1, minWidth: 200 }}>
        <b><Icon name="spark" size={16} /> {t('Fill in from a photo')}</b>
        <div className="meta">{t(done ? 'Filled in by AI. Please check every field and fix anything wrong.'
          : 'Take or choose a photo of the item. AI suggests the name, category, colour, brand and marks.')}</div>
        {err && <div className="meta" style={{ color: 'var(--red)' }}>{t(err)}</div>}
      </div>
      <label className={'btn' + (done ? ' sec' : '')} style={{ cursor: busy ? 'wait' : 'pointer' }} aria-disabled={busy}>
        {t(busy ? 'Reading the photo…' : done ? 'Use another photo' : 'Choose photo')}
        <input type="file" accept="image/*" capture="environment" hidden disabled={busy}
          onChange={e => { pick(e.target.files?.[0]); e.target.value = ''; }} />
      </label>
    </div>
  );
}

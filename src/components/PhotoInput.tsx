'use client';

import { useRef, useState } from 'react';
import { MAX_PHOTO_BYTES } from '@/lib/constants';
import { useT } from './Providers';

/** Returns an error message when the chosen photo is too large, otherwise ''. */
export function checkPhoto(fd: FormData): string {
  const f = fd.get('photo');
  return f instanceof File && f.size > MAX_PHOTO_BYTES ? 'Photo is too large. Please use a smaller image.' : '';
}

/** Photo upload with camera capture option on mobile. Shows a preview after selection. */
export const PhotoInput = () => {
  const t = useT();
  const [preview, setPreview] = useState<string | null>(null);
  const [mode, setMode] = useState<'file' | 'camera'>('file');
  const ref = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) { setPreview(null); return; }
    const url = URL.createObjectURL(file);
    setPreview(url);
  };

  return (
    <div className="photo-input-wrap">
      {/* Mode toggle: gallery or camera */}
      <div className="photo-modes">
        <button type="button" className={'photo-mode-btn' + (mode === 'file' ? ' on' : '')}
          onClick={() => { setMode('file'); setPreview(null); if (ref.current) ref.current.value = ''; }}>
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="12" cy="12" r="4"/></svg>
          {t('Gallery')}
        </button>
        <button type="button" className={'photo-mode-btn' + (mode === 'camera' ? ' on' : '')}
          onClick={() => { setMode('camera'); setPreview(null); if (ref.current) ref.current.value = ''; }}>
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
          {t('Camera')}
        </button>
      </div>

      <label className="photo-label">
        {preview ? (
          <div className="photo-preview">
            <img src={preview} alt={t('Photo preview')} />
            <span className="photo-change">{t('Change photo')}</span>
          </div>
        ) : (
          <div className="photo-placeholder">
            <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
            <span>{t(mode === 'camera' ? 'Take a photo' : 'Choose a photo')}</span>
            <span className="meta">{t('Optional · max 1.5 MB')}</span>
          </div>
        )}
        <input
          ref={ref}
          name="photo"
          type="file"
          accept="image/*"
          capture={mode === 'camera' ? 'environment' : undefined}
          onChange={handleChange}
          style={{ display: 'none' }}
        />
      </label>
    </div>
  );
};

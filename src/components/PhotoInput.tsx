'use client';

import { useEffect, useRef, useState } from 'react';
import { MAX_PHOTO_BYTES } from '@/lib/constants';
import { PhotoPicker } from './PhotoPicker';
import { useT } from './Providers';

/** Returns an error message when the chosen photo is too large, otherwise ''. */
export function checkPhoto(fd: FormData): string {
  const f = fd.get('photo');
  return f instanceof File && f.size > MAX_PHOTO_BYTES ? 'Photo is too large. Please use a smaller image.' : '';
}

/**
 * Photo field for plain forms (the form reads it as "photo" from its FormData): take a photo with the camera
 * or choose one from the gallery, see a preview, remove it. The picked photo is put into a hidden file input.
 */
export const PhotoInput = () => {
  const t = useT();
  const input = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  const set = (file: File | null) => {
    if (input.current) {
      const dt = new DataTransfer();
      if (file) dt.items.add(file);
      input.current.files = dt.files;
    }
    setPreview(file ? URL.createObjectURL(file) : null);
  };

  return (
    <div className="photo-input-wrap">
      <input ref={input} name="photo" type="file" accept="image/*" hidden />
      {preview ? (
        <div className="photo-preview">
          <img src={preview} alt={t('Photo preview')} />
          <button type="button" className="photo-remove" onClick={() => set(null)}>{t('Remove photo')}</button>
        </div>
      ) : (
        <div className="photo-placeholder">
          <PhotoPicker onPick={set} />
          <span className="meta">{t('Optional. Large photos are made smaller automatically.')}</span>
        </div>
      )}
    </div>
  );
};

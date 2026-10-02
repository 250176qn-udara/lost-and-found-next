'use client';

import { MAX_PHOTO_BYTES } from '@/lib/constants';

/** Returns an error message when the chosen photo is too large, otherwise ''. */
export function checkPhoto(fd: FormData): string {
  const f = fd.get('photo');
  return f instanceof File && f.size > MAX_PHOTO_BYTES ? 'Photo is too large. Please use a smaller image.' : '';
}

export const PhotoInput = () => <input name="photo" type="file" accept="image/*" />;

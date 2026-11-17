'use client';

import { useEffect, useRef, useState } from 'react';
import { MAX_PHOTO_BYTES } from '@/lib/constants';
import { Icon } from './Icon';
import { Modal } from './Modal';
import { useT } from './Providers';

/** Longest side of a photo we keep. Phone photos are much bigger; this is plenty to recognise an item. */
const MAX_SIDE = 1600;

/** Makes a photo small enough to upload (JPEG, at most MAX_SIDE px and MAX_PHOTO_BYTES). Small photos are kept as they are. */
export async function shrinkPhoto(file: File): Promise<File> {
  if (file.size <= MAX_PHOTO_BYTES && !/heic|heif/i.test(file.type)) return file;
  const img = await createImageBitmap(file);
  let side = MAX_SIDE, quality = 0.85;
  for (let i = 0; i < 6; i++) {
    const k = Math.min(1, side / Math.max(img.width, img.height));
    const c = document.createElement('canvas');
    c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
    c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height);
    const blob = await new Promise<Blob | null>(r => c.toBlob(r, 'image/jpeg', quality));
    if (blob && blob.size <= MAX_PHOTO_BYTES) return new File([blob], file.name.replace(/\.\w+$/, '') + '.jpg', { type: 'image/jpeg' });
    side = Math.round(side * 0.8); quality = Math.max(0.6, quality - 0.08);
  }
  return file; // could not get it small enough: the form shows the usual "too large" message
}

/**
 * Two ways to add a photo: take one with the camera (a live camera view inside the app, on laptops and phones),
 * or choose one from the gallery / files. Calls onPick with the photo, already made small enough to upload.
 * Where the browser cannot open the camera itself (e.g. not https), "Take photo" opens the phone's camera app instead.
 */
export function PhotoPicker({ onPick, busy = false, compact = false }: { onPick: (file: File) => void; busy?: boolean; compact?: boolean }) {
  const t = useT();
  const gallery = useRef<HTMLInputElement>(null);
  const cameraApp = useRef<HTMLInputElement>(null);
  const [camera, setCamera] = useState(false);

  const use = async (file: File | undefined) => { if (file) onPick(await shrinkPhoto(file)); };
  const openCamera = () => {
    if (typeof navigator.mediaDevices?.getUserMedia === 'function' && window.isSecureContext) setCamera(true);
    else cameraApp.current?.click();
  };

  return (
    <>
      <div className={'photopick' + (compact ? ' compact' : '')}>
        <button type="button" className="btn" disabled={busy} onClick={openCamera}><Icon name="camera" size={17} />{t('Take photo')}</button>
        <button type="button" className="btn sec" disabled={busy} onClick={() => gallery.current?.click()}><Icon name="image" size={17} />{t('Choose from gallery')}</button>
        <input ref={gallery} type="file" accept="image/*" hidden onChange={e => { void use(e.target.files?.[0]); e.target.value = ''; }} />
        <input ref={cameraApp} type="file" accept="image/*" capture="environment" hidden onChange={e => { void use(e.target.files?.[0]); e.target.value = ''; }} />
      </div>
      {camera && <CameraDialog onClose={() => setCamera(false)} onPhoto={f => { setCamera(false); void use(f); }}
        onFallback={() => { setCamera(false); cameraApp.current?.click(); }} />}
    </>
  );
}

/** Live camera view: take a picture, look at it, then use it or take it again. */
function CameraDialog({ onClose, onPhoto, onFallback }: { onClose: () => void; onPhoto: (f: File) => void; onFallback: () => void }) {
  const t = useT();
  const video = useRef<HTMLVideoElement>(null);
  const stream = useRef<MediaStream | null>(null);
  const [facing, setFacing] = useState<'environment' | 'user'>('environment');
  const [cams, setCams] = useState(0);
  const [err, setErr] = useState('');
  const [shot, setShot] = useState<{ file: File; url: string } | null>(null);

  // Start (or restart, after switching) the camera; always stop it when the dialog closes.
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: facing }, width: { ideal: 1920 }, height: { ideal: 1080 } }, audio: false });
        if (!alive) { s.getTracks().forEach(tr => tr.stop()); return; }
        stream.current = s;
        if (video.current) { video.current.srcObject = s; void video.current.play().catch(() => {}); }
        const devices = await navigator.mediaDevices.enumerateDevices();
        setCams(devices.filter(d => d.kind === 'videoinput').length);
        setErr('');
      } catch {
        setErr('Camera not available. Allow camera access in the browser, or choose a photo from the gallery.');
      }
    })();
    return () => { alive = false; stream.current?.getTracks().forEach(tr => tr.stop()); stream.current = null; };
  }, [facing]);
  useEffect(() => () => { if (shot) URL.revokeObjectURL(shot.url); }, [shot]);

  const take = () => {
    const v = video.current;
    if (!v || !v.videoWidth) return;
    const k = Math.min(1, MAX_SIDE / Math.max(v.videoWidth, v.videoHeight));
    const c = document.createElement('canvas');
    c.width = Math.round(v.videoWidth * k); c.height = Math.round(v.videoHeight * k);
    const g = c.getContext('2d')!;
    if (facing === 'user') { g.translate(c.width, 0); g.scale(-1, 1); } // selfie view is mirrored on screen; keep the photo the same way
    g.drawImage(v, 0, 0, c.width, c.height);
    c.toBlob(b => {
      if (!b) return;
      const file = new File([b], `photo-${Date.now()}.jpg`, { type: 'image/jpeg' });
      setShot({ file, url: URL.createObjectURL(b) });
    }, 'image/jpeg', 0.88);
  };

  return (
    <Modal onClose={onClose}>
      <div className="camdlg">
        <div className="camdlg-head">
          <b><Icon name="camera" size={18} /> {t('Take photo')}</b>
          <button type="button" className="camdlg-x" onClick={onClose} aria-label={t('Close')}>×</button>
        </div>
        <div className="camdlg-view">
          {shot
            ? <img src={shot.url} alt={t('Photo preview')} />
            : <video ref={video} playsInline muted className={facing === 'user' ? 'mirror' : ''} />}
          {err && !shot && <div className="camdlg-err"><p>{t(err)}</p><button type="button" className="btn sec" onClick={onFallback}>{t('Use the phone camera app')}</button></div>}
        </div>
        <div className="camdlg-actions">
          {shot ? (
            <>
              <button type="button" className="btn sec" onClick={() => setShot(null)}><Icon name="out" size={16} />{t('Retake')}</button>
              <button type="button" className="btn" onClick={() => onPhoto(shot.file)}><Icon name="check" size={16} />{t('Use photo')}</button>
            </>
          ) : (
            <>
              {cams > 1 && <button type="button" className="btn sec" onClick={() => setFacing(f => (f === 'environment' ? 'user' : 'environment'))}>{t('Switch camera')}</button>}
              <button type="button" className="camdlg-shutter" onClick={take} disabled={!!err} aria-label={t('Take photo')}><span /></button>
            </>
          )}
        </div>
      </div>
    </Modal>
  );
}

'use client';

import { useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';
import { useT } from './Providers';
import { Icon } from './Icon';

// Reads QR codes with the camera, or from a photo. Uses the browser's own BarcodeDetector when there is one
// (Chrome / Edge / Android), and jsQR everywhere else (Safari, Firefox). The camera needs https or localhost.

type Detector = { detect: (src: CanvasImageSource) => Promise<{ rawValue: string }[]> };
function nativeDetector(): Detector | null {
  const BD = (globalThis as unknown as { BarcodeDetector?: new (o: { formats: string[] }) => Detector }).BarcodeDetector;
  try { return BD ? new BD({ formats: ['qr_code'] }) : null; } catch { return null; }
}

function decodeCanvas(canvas: HTMLCanvasElement, src: CanvasImageSource, w: number, h: number): string | null {
  const scale = Math.min(1, 800 / Math.max(w, h)); // smaller image = faster, still enough for a label
  canvas.width = Math.round(w * scale);
  canvas.height = Math.round(h * scale);
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;
  ctx.drawImage(src, 0, 0, canvas.width, canvas.height);
  const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
  return jsQR(img.data, img.width, img.height, { inversionAttempts: 'attemptBoth' })?.data ?? null;
}

export function QrScanner({ onCode }: { onCode: (text: string) => void }) {
  const t = useT();
  const video = useRef<HTMLVideoElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const stream = useRef<MediaStream | null>(null);
  const [on, setOn] = useState(false);
  const [err, setErr] = useState('');

  const stop = () => {
    stream.current?.getTracks().forEach(tr => tr.stop());
    stream.current = null;
    setOn(false);
  };
  useEffect(() => stop, []);

  async function start() {
    setErr('');
    if (!navigator.mediaDevices?.getUserMedia) {
      return setErr(window.isSecureContext ? 'This browser cannot use the camera. Take a photo of the label instead.'
        : 'The camera only works on https (or localhost). Take a photo of the label instead.');
    }
    try {
      stream.current = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
    } catch {
      return setErr('Camera not available. Allow camera access, or take a photo of the label instead.');
    }
    setOn(true);
  }

  // Once the video element is on screen: play the stream and look for a code a few times per second.
  useEffect(() => {
    if (!on || !video.current || !stream.current) return;
    const v = video.current;
    v.srcObject = stream.current;
    void v.play().catch(() => {});
    const native = nativeDetector();
    let busy = false, alive = true;
    const timer = setInterval(async () => {
      if (busy || !alive || v.readyState < 2) return;
      busy = true;
      try {
        const text = native
          ? (await native.detect(v))[0]?.rawValue ?? null
          : decodeCanvas(canvas.current!, v, v.videoWidth, v.videoHeight);
        if (text && alive) { alive = false; stop(); onCode(text); }
      } catch { /* a frame that cannot be read: try the next one */ }
      busy = false;
    }, 250);
    return () => { alive = false; clearInterval(timer); };
  }, [on, onCode]);

  async function fromPhoto(file: File | undefined) {
    if (!file) return;
    setErr('');
    try {
      const bmp = await createImageBitmap(file);
      const text = decodeCanvas(canvas.current!, bmp, bmp.width, bmp.height);
      bmp.close();
      if (text) onCode(text);
      else setErr('No QR code found in the photo. Hold the camera closer and try again.');
    } catch {
      setErr('This photo cannot be read.');
    }
  }

  return (
    <div className="scanner">
      {on ? (
        <>
          <div className="scanview">
            <video ref={video} muted playsInline aria-label={t('Camera')} />
            <span className="scanframe" aria-hidden />
          </div>
          <p className="meta">{t('Hold the QR label inside the square.')}</p>
          <button type="button" className="btn sec" onClick={stop}>{t('Stop camera')}</button>
        </>
      ) : (
        <div className="btnrow" style={{ marginTop: 0 }}>
          <button type="button" className="btn" onClick={start}><Icon name="scan" size={16} />{t('Scan with camera')}</button>
          <label className="btn sec" style={{ cursor: 'pointer' }}>
            {t('Scan from a photo')}
            <input type="file" accept="image/*" capture="environment" hidden onChange={e => { void fromPhoto(e.target.files?.[0]); e.target.value = ''; }} />
          </label>
        </div>
      )}
      {err && <p className="meta" style={{ color: 'var(--red)' }}>{t(err)}</p>}
      <canvas ref={canvas} hidden />
    </div>
  );
}

/** Pulls the item code out of whatever was scanned (a label, a pickup pass, or a scanner that typed it). */
export function itemCodeFrom(text: string): string {
  const m = text.toUpperCase().match(/LF-\d{4}-\d{3,}/);
  return m ? m[0] : text.trim().toUpperCase();
}

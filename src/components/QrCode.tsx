import qrcode from 'qrcode-generator';

/** A real, scannable QR code (drawn as SVG, so it prints sharply). Holds the item code, e.g. LF-2026-0148. */
export function QrCode({ text, size = 132 }: { text: string; size?: number }) {
  const qr = qrcode(0, 'M'); // 0 = smallest size that fits; M = survives ~15% damage (scratched labels)
  qr.addData(text);
  qr.make();
  const n = qr.getModuleCount();
  // One path for all dark modules: small markup even for long codes.
  let d = '';
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (qr.isDark(y, x)) d += `M${x} ${y}h1v1h-1z`;
  return (
    <svg className="qrsvg" viewBox={`-4 -4 ${n + 8} ${n + 8}`} width={size} height={size} role="img" aria-label={text} shapeRendering="crispEdges">
      <rect x={-4} y={-4} width={n + 8} height={n + 8} fill="#fff" />
      <path d={d} fill="#111" />
    </svg>
  );
}

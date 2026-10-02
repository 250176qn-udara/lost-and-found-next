// MOCK: looks like a QR code but cannot be scanned yet. The pattern comes from the text, so it never changes.
export function QrCode({ text, size = 132 }: { text: string; size?: number }) {
  const n = 21;
  let h = 7;
  for (const ch of text) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const rnd = () => (h = (h * 1664525 + 1013904223) >>> 0) / 4294967296;
  const cells: [number, number][] = [];
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    const inFinder = (x < 8 && y < 8) || (x > 12 && y < 8) || (x < 8 && y > 12);
    if (!inFinder && rnd() > 0.52) cells.push([x, y]);
  }
  const finder = (x: number, y: number) => (
    <g key={`f${x}-${y}`}>
      <rect x={x} y={y} width={7} height={7} fill="#111" />
      <rect x={x + 1} y={y + 1} width={5} height={5} fill="#fff" />
      <rect x={x + 2} y={y + 2} width={3} height={3} fill="#111" />
    </g>
  );
  return (
    <svg className="qrsvg" viewBox="-1 -1 23 23" width={size} height={size} role="img" aria-label={text} shapeRendering="crispEdges">
      <rect x={-1} y={-1} width={23} height={23} fill="#fff" />
      {cells.map(([x, y]) => <rect key={`${x},${y}`} x={x} y={y} width={1} height={1} fill="#111" />)}
      {finder(0, 0)}{finder(14, 0)}{finder(0, 14)}
    </svg>
  );
}

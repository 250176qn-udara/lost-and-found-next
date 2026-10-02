// Distances between map pins. No server-only: used by pages and by matching.

export type LatLng = { lat: number; lng: number };

/** Pins this close count as "the same place" for matching. */
export const NEAR_METERS = 150;

/** Great-circle distance in metres (haversine). */
export function distanceM(a: LatLng, b: LatLng): number {
  const R = 6_371_000, rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad, dLng = (b.lng - a.lng) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Both pins exist and are within NEAR_METERS. */
export const isNear = (a: Partial<LatLng> | null | undefined, b: Partial<LatLng> | null | undefined) =>
  a?.lat != null && a.lng != null && b?.lat != null && b.lng != null && distanceM(a as LatLng, b as LatLng) <= NEAR_METERS;

/** "Open in Google Maps" link for a pin (works without an API key). */
export const mapsLink = (p: LatLng) => `https://www.google.com/maps/search/?api=1&query=${p.lat},${p.lng}`;

/** Read a DECIMAL column (mysql2 returns strings) as a number, or null. */
export const num = (v: unknown) => (v === null || v === undefined || v === '' ? null : Number(v));

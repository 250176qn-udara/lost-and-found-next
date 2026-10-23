// How sure we are that a lost report and a found item are the same thing.
// With Gemini (see gemini.ts) its score is used; the rule-based reasons are still listed.
import { distanceM, NEAR_METERS } from './geo';
import { isKnownPlace } from './constants';

type Side = { place: string | null; date: string | null; lat?: number | null; lng?: number | null; category?: string | null };

export function scoreMatch(lost: Side, found: Side, aiScore: number | null = null): { score: number; why: string[]; ai: boolean } {
  const why: string[] = [];
  let score = 50;
  if (aiScore !== null) why.push('Checked by AI');
  if (!lost.category || !found.category || lost.category === found.category) why.push('Same category');
  const pins = lost.lat != null && lost.lng != null && found.lat != null && found.lng != null;
  const metres = pins ? distanceM({ lat: lost.lat!, lng: lost.lng! }, { lat: found.lat!, lng: found.lng! }) : null;
  if (isKnownPlace(lost.place) && isKnownPlace(found.place) && lost.place!.toLowerCase() === found.place!.toLowerCase()) { score += 25; why.push('Same place'); }
  else if (metres !== null && metres <= NEAR_METERS) { score += 20; why.push('Found nearby'); }
  if (lost.date && found.date) {
    const days = Math.abs(Date.parse(lost.date) - Date.parse(found.date)) / 86_400_000;
    if (days === 0) { score += 20; why.push('Same day'); }
    else if (days <= 2) { score += 10; why.push('Date within 2 days'); }
  }
  return { score: aiScore ?? score, why, ai: aiScore !== null };
}

export const scoreClass = (s: number) => (s >= 80 ? '' : s >= 60 ? 'mid' : 'low');

// How sure we are that a lost report and a found item are the same thing.
// findMatchFor() only pairs items of the same category, so that reason is always there.

type Side = { place: string | null; date: string | null };

export function scoreMatch(lost: Side, found: Side): { score: number; why: string[] } {
  const why = ['Same category'];
  let score = 50;
  if (lost.place && found.place && lost.place.toLowerCase() === found.place.toLowerCase()) { score += 25; why.push('Same place'); }
  if (lost.date && found.date) {
    const days = Math.abs(Date.parse(lost.date) - Date.parse(found.date)) / 86_400_000;
    if (days === 0) { score += 20; why.push('Same day'); }
    else if (days <= 2) { score += 10; why.push('Date within 2 days'); }
  }
  return { score, why };
}

export const scoreClass = (s: number) => (s >= 80 ? '' : s >= 60 ? 'mid' : 'low');

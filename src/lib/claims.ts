// A claim's answers: the details only the owner knows, plus where and when they lost the item.
// Stored together in the claims.answers text column (no schema change), with fixed markers so both
// the office page and the claimant's page can show them as separate fields.

export type ClaimAnswers = { details: string; place: string; date: string };

const SEP = '\n---\n';

/** Builds the stored text. */
export function packAnswers(a: ClaimAnswers): string {
  return `${a.details.trim()}${SEP}Place: ${a.place.trim()}\nDate: ${a.date.trim()}`;
}

/** Reads the stored text back. Claims made before place and date were asked have empty place and date. */
export function unpackAnswers(raw: string): ClaimAnswers {
  const i = raw.lastIndexOf(SEP);
  if (i < 0) return { details: raw, place: '', date: '' };
  const tail = raw.slice(i + SEP.length);
  const pick = (k: string) => tail.match(new RegExp(`^${k}: (.*)$`, 'm'))?.[1]?.trim() ?? '';
  return { details: raw.slice(0, i), place: pick('Place'), date: pick('Date') };
}

import 'server-only';

// Google Gemini (free API key from https://aistudio.google.com/apikey). Used for two things:
//  1. describePhoto: a photo of an item -> suggested name, category, colour, brand, marks (the user checks them).
//  2. rankMatches: compares one report with candidate items (text + photos) and scores each pair.
// Without GEMINI_API_KEY, or when Gemini fails or is slow, the app keeps working with the rule-based matching.
// Note: on the free tier Google may use what is sent to improve its products, so private details are kept short.

const KEY = process.env.GEMINI_API_KEY ?? '';
/** "gemini-flash-latest" always points to Google's current Flash model (free tier). Set GEMINI_MODEL to pin one. */
const MODEL = process.env.GEMINI_MODEL || 'gemini-flash-latest';
/** GEMINI_API_BASE is only for automated tests (a fake Gemini server). */
const URL_BASE = process.env.GEMINI_API_BASE || 'https://generativelanguage.googleapis.com/v1beta/models';

export const geminiReady = () => KEY.length > 10;

type Part = { text: string } | { inlineData: { mimeType: string; data: string } };
type Schema = Record<string, unknown>;

/** A stored data: URL (items.photo) or an upload as a Gemini image part. */
export function imagePart(dataUrl: string | null | undefined): Part | null {
  const m = dataUrl?.match(/^data:(image\/[a-z]+);base64,(.+)$/s);
  return m ? { inlineData: { mimeType: m[1], data: m[2] } } : null;
}

async function generate<T>(parts: Part[], schema: Schema, timeoutMs: number): Promise<T> {
  const res = await fetch(`${URL_BASE}/${MODEL}:generateContent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': KEY },
    body: JSON.stringify({
      contents: [{ role: 'user', parts }],
      generationConfig: { responseMimeType: 'application/json', responseSchema: schema, temperature: 0.2 },
    }),
    signal: AbortSignal.timeout(timeoutMs),
    cache: 'no-store',
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Gemini ${res.status}: ${body.slice(0, 300)}`);
  }
  const json = await res.json() as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
  const text = json.candidates?.[0]?.content?.parts?.map(p => p.text ?? '').join('') ?? '';
  return JSON.parse(text) as T;
}

// ---------- 1. photo -> form ----------

export type PhotoGuess = { title: string; category: string; colour: string; brand: string; marks: string; titleJa: string };

export async function describePhotoWithGemini(photo: Part, categories: string[]): Promise<PhotoGuess> {
  const g = await generate<PhotoGuess>([
    photo,
    { text: [
      'This is a photo of an item that was lost or found at a vocational college in Japan.',
      'Describe the item for a lost-and-found form. Be short and concrete.',
      '- title: a short English name, e.g. "Black leather wallet", "White AirPods case".',
      '- titleJa: the same name in Japanese.',
      `- category: exactly one of the given categories (use "Other" only if nothing fits).`,
      '- colour, brand: empty string if you cannot see it. Do not guess a brand.',
      '- marks: visible stickers, scratches, name tags or keychains, in a few words; empty if none.',
      'Never copy personal data you can read (names, ID numbers, card numbers, phone numbers) into any field.',
    ].join('\n') },
  ], {
    type: 'OBJECT',
    properties: {
      title: { type: 'STRING' }, titleJa: { type: 'STRING' },
      category: { type: 'STRING', enum: categories },
      colour: { type: 'STRING' }, brand: { type: 'STRING' }, marks: { type: 'STRING' },
    },
    required: ['title', 'titleJa', 'category', 'colour', 'brand', 'marks'],
  }, 25_000);
  const cut = (s: unknown, n: number) => String(s ?? '').trim().slice(0, n);
  return {
    title: cut(g.title, 150), titleJa: cut(g.titleJa, 150),
    category: categories.includes(g.category) ? g.category : (categories.includes('Other') ? 'Other' : categories[0]),
    colour: cut(g.colour, 60), brand: cut(g.brand, 60), marks: cut(g.marks, 200),
  };
}

// ---------- 2. matching ----------

export type MatchSide = { id: number; title: string; category: string; place: string; date: string | null; description: string | null; photo: string | null };
export type Ranked = { id: number; score: number; reason: string };

/**
 * Scores how likely each candidate is the same physical item as `item` (0-100), with a short reason for staff.
 * At most 8 candidates and 5 photos are sent, so it stays inside the free tier and answers in a few seconds.
 */
export async function rankMatchesWithGemini(item: MatchSide & { kind: 'lost' | 'found' }, candidates: MatchSide[]): Promise<Ranked[]> {
  const list = candidates.slice(0, 8);
  const parts: Part[] = [];
  let photos = 0;
  const describe = (s: MatchSide, label: string) => {
    parts.push({ text: `${label} [id ${s.id}] "${s.title}" · category: ${s.category} · place: ${s.place} · date: ${s.date ?? 'unknown'}` +
      ` · details: ${(s.description ?? '').replace(/\s+/g, ' ').slice(0, 400) || 'none'}` });
    const img = photos < 5 ? imagePart(s.photo) : null;
    if (img) { parts.push(img); photos++; }
  };
  parts.push({ text: [
    `A ${item.kind === 'lost' ? 'LOST report' : 'FOUND item'} at a college lost-and-found office is compared with ${item.kind === 'lost' ? 'found items' : 'lost reports'}.`,
    'For each candidate, score 0-100 how likely it is the SAME physical item. Use the name, category, colour, brand, marks, place, date and photos.',
    'Different colour or brand means a low score. Places in the same building and dates within a few days make it more likely.',
    'reason: one short English sentence for staff, e.g. "Same black Tanaka wallet, found the same day in the same building".',
  ].join('\n') });
  describe(item, item.kind === 'lost' ? 'LOST' : 'FOUND');
  list.forEach(c => describe(c, 'CANDIDATE'));
  const out = await generate<{ matches: Ranked[] }>(parts, {
    type: 'OBJECT',
    properties: {
      matches: {
        type: 'ARRAY',
        items: { type: 'OBJECT', properties: { id: { type: 'INTEGER' }, score: { type: 'INTEGER' }, reason: { type: 'STRING' } }, required: ['id', 'score', 'reason'] },
      },
    },
    required: ['matches'],
  }, 20_000);
  const ids = new Set(list.map(c => c.id));
  return (out.matches ?? [])
    .filter(m => ids.has(Number(m.id)))
    .map(m => ({ id: Number(m.id), score: Math.max(0, Math.min(100, Math.round(Number(m.score) || 0))), reason: String(m.reason ?? '').slice(0, 300) }))
    .sort((a, b) => b.score - a.score);
}

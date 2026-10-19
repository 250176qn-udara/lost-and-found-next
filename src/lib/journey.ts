// The path every lost item takes, and "who does what next" for each person.
// Pure functions: used by Server Components to draw the journey bar and the next-step box.
import type { ClaimStatus } from './types';

/** The seven steps shown on every item and claim card. */
export const JOURNEY = ['Reported', 'Matched', 'Claimed', 'At the office', 'Approved', 'Returned', 'Thanked'] as const;

/** Whose turn it is. 'you' = the person looking at the screen. */
export type Who = 'you' | 'staff' | 'finder' | 'owner' | 'system' | 'done';

export type NextStep = { who: Who; text: string; href?: string; label?: string };
export type Journey = { done: boolean[]; next: NextStep };

/** The owner's side: a lost report and/or a claim on a found item. */
export function ownerJourney(o: {
  matched: boolean; claim: ClaimStatus | null; claimId?: number | null; atOffice: boolean; thanked: boolean;
}): Journey {
  const claimed = o.claim === 'pending' || o.claim === 'approved' || o.claim === 'returned';
  const approved = o.claim === 'approved' || o.claim === 'returned';
  const returned = o.claim === 'returned';
  const done = [true, o.matched || claimed, claimed, o.atOffice || returned, approved, returned, returned && o.thanked];

  let next: NextStep;
  if (returned && o.thanked) next = { who: 'done', text: 'All done. Thank you for using Lost & Found!' };
  else if (returned) next = { who: 'you', text: 'Send a thank-you letter to the person who found it.', href: `/thanks/${o.claimId}`, label: 'Write a thank-you letter' };
  else if (o.claim === 'approved' && o.atOffice) next = { who: 'you', text: 'Go to the office with your pickup code and a photo ID.', href: '/my-items?tab=claims', label: 'Open pickup pass' };
  else if (o.claim === 'approved') next = { who: 'finder', text: 'The finder is bringing it to the office. We will tell you when you can pick it up.' };
  else if (o.claim === 'pending') next = { who: 'staff', text: 'Staff are checking your answers. If they ask a question, it appears in Messages.', href: '/messages', label: 'Messages' };
  else if (o.claim === 'rejected') next = { who: 'you', text: 'Your claim was not approved. You can claim again with more details.', href: '/browse', label: 'Browse found items' };
  else if (o.matched) next = { who: 'you', text: 'Check the possible match. If it is yours, press “This is mine”.' };
  else next = { who: 'system', text: 'We are looking for a match and will notify you. You can also look yourself.', href: '/browse', label: 'Browse found items' };
  return { done, next };
}

/** The finder's side: a found item they posted. */
export function finderJourney(f: {
  claim: ClaimStatus | null; handedIn: boolean; atOffice: boolean; returned: boolean; thanked: boolean;
}): Journey {
  const claimed = f.claim === 'pending' || f.claim === 'approved' || f.claim === 'returned' || f.returned;
  const approved = f.claim === 'approved' || f.claim === 'returned' || f.returned;
  const done = [true, claimed, claimed, f.atOffice || f.returned, approved, f.returned, f.returned && f.thanked];

  let next: NextStep;
  if (f.returned && f.thanked) next = { who: 'done', text: 'The owner got it back and sent you a thank-you letter.', href: '/my-items?tab=thanks', label: 'Read the letter' };
  else if (f.returned) next = { who: 'done', text: 'Returned to its owner. Thank you for your help!' };
  else if (claimed && !f.atOffice && !f.handedIn) next = { who: 'you', text: 'Someone claimed it. Please bring it to the office.' };
  else if (f.handedIn && !f.atOffice) next = { who: 'staff', text: 'Staff will confirm that they received it.' };
  else if (f.atOffice && f.claim === 'pending') next = { who: 'staff', text: 'Staff are checking the owner’s answers.' };
  else if (f.atOffice && f.claim === 'approved') next = { who: 'owner', text: 'Waiting for the owner to pick it up at the office.' };
  else if (f.atOffice) next = { who: 'owner', text: 'It is safe at the office. Waiting for the owner.' };
  else next = { who: 'owner', text: 'Waiting for the owner. Keep it safe, or hand it to the office any time.' };
  return { done, next };
}

/** Staff looking at a found item: what the front desk should do next. */
export function staffJourney(s: {
  itemId: number; claim: ClaimStatus | null; handedIn: boolean; atOffice: boolean; returned: boolean; closed: boolean; thanked: boolean;
}): Journey {
  const claimed = s.claim === 'pending' || s.claim === 'approved' || s.returned;
  const approved = s.claim === 'approved' || s.returned;
  const done = [true, claimed, claimed, s.atOffice || s.returned, approved, s.returned, s.returned && s.thanked];

  let next: NextStep;
  if (s.closed) next = { who: 'done', text: 'Closed without the owner (see the record above).' };
  else if (s.returned) next = { who: 'done', text: 'Returned to its owner.' };
  else if (s.handedIn && !s.atOffice) next = { who: 'you', text: 'The finder says it is at the office. Confirm it and choose a shelf.', href: `/register?receive=${s.itemId}`, label: 'Confirm the item is at the office' };
  else if (s.claim === 'pending') next = { who: 'you', text: 'Compare the claimant’s answers with the private details, then approve or reject.', href: '/desk', label: 'Front desk' };
  else if (s.claim === 'approved' && s.atOffice) next = { who: 'owner', text: 'Waiting for the owner. When they come, check the pickup code and ID.', href: '/desk?tab=pickups', label: 'Pickups' };
  else if (s.claim === 'approved') next = { who: 'finder', text: 'Waiting for the finder to bring it to the office.', href: '/messages', label: 'Messages' };
  else if (!s.atOffice) next = { who: 'finder', text: 'The finder still has it. No one has claimed it yet.' };
  else next = { who: 'owner', text: 'Stored at the office. Waiting for the owner to claim it.' };
  return { done, next };
}

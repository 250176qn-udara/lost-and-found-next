import type { T } from './i18n';
import type { ClaimEvent, ItemDetail } from './types';
import { when, type TimelineEvent } from '@/components/ui';

/** Real timeline from the item's own timestamps and its claims. */
export function itemEvents(it: ItemDetail, claims: ClaimEvent[], t: T, showNames: boolean): TimelineEvent[] {
  const by = (name: string | null) => (showNames && name ? ` · ${name}` : '');
  // A found item is registered (listed for the community) the moment it is reported.
  const ev: TimelineEvent[] = [{ label: t(it.kind === 'found' ? 'Registered' : 'Reported'), meta: when(it.createdAt) + by(it.reporterName), on: true }];
  if (it.kind === 'found' && it.handedInAt) ev.push({ label: t('Finder handed it to the office'), meta: when(it.handedInAt) + by(it.reporterName), on: true });
  if (it.kind === 'found' && it.receivedAt) ev.push({ label: t('Received at office'), meta: when(it.receivedAt) + by(it.receivedByName), on: true });
  ev.push({ label: t('Matched'), meta: it.matchedAt ? when(it.matchedAt) : '—', on: it.status >= 3 });
  for (const c of claims) {
    ev.push({ label: t('Claim sent'), meta: when(c.createdAt) + by(c.claimantName), on: true });
    if (c.decidedAt) ev.push({ label: t(c.status === 'rejected' ? 'Claim rejected' : 'Claim approved'), meta: when(c.decidedAt) + by(c.decidedByName), on: true });
    if (c.returnedAt) ev.push({ label: t('Returned'), meta: when(c.returnedAt) + by(c.returnedByName) + (c.idType ? ` · ${t(c.idType)}` : ''), on: true });
  }
  if (!claims.some(c => c.returnedAt)) ev.push({ label: t('Returned'), meta: '—', on: false });
  return ev;
}

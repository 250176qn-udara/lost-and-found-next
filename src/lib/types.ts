import type { NotifyEvent } from './constants';
export type Lang = 'en' | 'ja';
export type Role ='member' | 'staff' | 'admin' | 'super';
export type MembershipStatus = 'pending' | 'approved' | 'rejected' | 'left';
export type Kind = 'lost' | 'found';
/** 1 Reported · 2 Registered (found items: listed for the community) · 3 Matched · 4 Verified · 5 Returned · 6 Closed without owner */
export type ItemStatus = 1 | 2 | 3 | 4 | 5 | 6;
export type ClaimStatus = 'pending' | 'approved' | 'rejected' | 'returned';

export type User = {
  id: number;
  name: string;
  email: string;
  role: Role;
  organizationId: number | null;
  membershipStatus: MembershipStatus | null;
};

export type Me = {
  user: User;
  pending: { id: number; organizationId: number } | null;
};

export type Organization = { id: number; name: string; type: string };

/** A place on the organization's list, with an optional map pin. */
export type Place = { id: number; name: string; lat: number | null; lng: number | null };

export type Item = {
  id: number;
  kind: Kind | null;
  title: string;
  category: string;
  place: string;
  /** Map pin (optional). */
  lat?: number | null;
  lng?: number | null;
  date: string | null;
  description: string | null;
  status: ItemStatus;
  hasPhoto: boolean;
  matchedItemId?: number;
  matchedTitle?: string | null;
  matchedPlace?: string | null;
  matchedDate?: string | null;
  /** getBrowseItems: posted by the viewer (they cannot claim it). */
  mine?: boolean;
  /** getBrowseItems: the viewer's own open claim on this item, if any. */
  myClaim?: ClaimStatus | null;
  /** Only filled by getMyItems. */
  itemCode?: string | null;
  shelf?: string | null;
  receivedAt?: string | null;
  handedInAt?: string | null;
  createdAt?: string;
};

export type Claim = {
  id: number;
  itemTitle: string;
  itemPlace: string;
  itemDate: string | null;
  itemCode: string | null;
  answers: string;
  status: ClaimStatus;
  claimantName: string | null;
  claimantEmail: string | null;
  /** Staff claim lists only. */
  claimantId?: number;
  lostDescription: string | null;
  createdAt: string;
  /** Staff claim lists only: whether the found item is at the office, and who posted it. */
  atOffice?: boolean;
  finderName?: string | null;
  handedIn?: boolean;
  /** Staff claim lists: the found item's hidden details (what the owner should be able to describe). */
  foundDescription?: string | null;
  foundItemId?: number;
  /** Given when staff approve the claim; the owner tells it at pickup. Claimant and staff only. */
  pickupCode?: string | null;
  shelf?: string | null;
  decidedAt?: string | null;
  /** Staff lists: whether a pickup code must be entered at handover (the code itself is never sent to staff). */
  hasCode?: boolean;
};

export type QueueItem = {
  id: number;
  title: string;
  category: string;
  place: string;
  date: string | null;
  description: string | null;
  reporterName: string;
  /** When the finder said they handed it to the office (null = still with the finder). */
  handedInAt: string | null;
};

export type ScannedItem = {
  /** An approved claim is waiting: the owner can pick it up. */
  pickupReady?: boolean;
  id: number;
  kind: Kind;
  title: string;
  category: string;
  place: string;
  date: string | null;
  description: string | null;
  status: ItemStatus;
  itemCode: string;
  shelf: string | null;
  finderName: string | null;
  receivedAt: string | null;
  hasPhoto: boolean;
  reporterName: string;
  receivedByName: string | null;
};

/** One item with everything the detail page and item history need. */
export type ItemDetail = Item & {
  itemCode: string | null;
  shelf: string | null;
  finderName: string | null;
  reporterId: number;
  reporterName: string;
  receivedByName: string | null;
  createdAt: string;
  receivedAt: string | null;
  /** The finder says they handed it to the office; staff have not confirmed yet if receivedAt is null. */
  handedInAt: string | null;
  matchedAt: string | null;
  disposedAt: string | null;
  disposalMethod: string | null;
  disposalNote: string | null;
};

/** A row of the admin "All items" table. daysKept counts from the day staff received it. */
export type OrgItem = {
  id: number;
  kind: Kind;
  title: string;
  hasPhoto: boolean;
  category: string;
  place: string;
  date: string | null;
  status: ItemStatus;
  itemCode: string | null;
  shelf: string | null;
  createdAt: string;
  reporterName: string;
  daysKept: number | null;
  lat: number | null;
  lng: number | null;
};

/** A lost report and the found item the system linked to it. */
export type MatchPair = {
  lostId: number; lostTitle: string; lostPlace: string; lostDate: string | null; lostStatus: ItemStatus; ownerName: string;
  foundId: number; foundTitle: string; foundPlace: string; foundDate: string | null; foundCode: string | null;
  lostLat: number | null; lostLng: number | null; foundLat: number | null; foundLng: number | null;
  lostCategory: string; foundCategory: string;
  /** Gemini's score and reason (reason: staff only, it may mention private details). */
  aiScore: number | null; aiReason: string | null;
};

/** One line of the audit log, built from the timestamps the tables already keep. */
export type AuditRow = { at: string; area: 'Items' | 'Claims' | 'Membership'; action: string; who: string | null; target: string; org: string };

export type ClaimEvent = { id: number; status: ClaimStatus; claimantId: number; claimantName: string; createdAt: string; decidedAt: string | null; decidedByName: string | null; returnedAt: string | null; returnedByName: string | null; idType: string | null };

export type Notice = { id: string; title: string; text: string; at: string; href: string; event?: NotifyEvent; read?: boolean };

export type PendingRequest ={ id: number; name: string; email: string; organization_name: string };
export type Member = { name: string; email: string; role: Role };
export type MemberRow = { membershipId: number; userId: number; name: string; email: string; role: Role; since: string | null };

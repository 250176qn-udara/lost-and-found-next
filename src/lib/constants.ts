import type { Role } from './types';

export const STEPS = ['Reported', 'Registered', 'Matched', 'Verified', 'Returned'];
/** Chart colours (pastel theme). */
export const COLORS = ['#F6A18C', '#A9C7B5', '#F8D99B', '#9DB8D3', '#D8A8C2', '#C9B79C'];

/** Item categories, chosen for an IT college (laptops, chargers, student IDs, commuter passes...). */
export const CATEGORIES = ['Smartphone', 'Laptop / tablet', 'Earphones', 'Charger / cable', 'USB / storage', 'Electronics', 'ID card', 'IC card / pass', 'Wallet', 'Keys', 'Bag', 'Umbrella', 'Clothing', 'Textbook / stationery', 'Water bottle', 'Other'];
export const SHELVES = ['A-01', 'A-02', 'B-01', 'B-02'];
export const ID_TYPES = ['Student ID', 'Driver’s license', 'My Number card', 'Passport'];

export const ROLE_NAMES: Record<Role, string> = {
  member: 'Member',
  staff: 'Staff',
  admin: 'Org admin',
  super: 'Super admin',
};

/** The interactive guide (public/how-it-works.html). */
export const GUIDE_URL = '/how-it-works.html';

export type NavGroup = { group: string; links: [href: string, label: string, icon: string][] };

/** Sidebar menus. Each entry is a hub page; its sections are tabs or expandable cards inside the page. */
export const NAV: Record<Role, NavGroup[]> = {
  member: [
    { group: 'Menu', links: [['/home', 'Dashboard', 'home'], ['/report', 'Report lost item', 'search'], ['/report?kind=found', 'Report found item', 'hand'],
      ['/browse', 'Found items', 'grid'], ['/my-items', 'My items', 'box'], ['/messages', 'Messages', 'chat'], ['/notifications', 'Notifications', 'bell'], ['/wall', 'Thank-you wall', 'heart']] },
    { group: 'Account', links: [['/profile', 'Account', 'user'], [GUIDE_URL, 'How it works', 'other']] },
  ],
  staff: [
    { group: 'Front desk', links: [['/desk', 'Front desk', 'desk'], ['/messages', 'Messages', 'chat'], ['/register', 'Intake', 'inbox'], ['/items', 'Item list', 'list'], ['/storage', 'Storage', 'shelf'], ['/wall', 'Thank-you wall', 'heart']] },
    { group: 'Account', links: [['/profile', 'Account', 'user'], [GUIDE_URL, 'How it works', 'other']] },
  ],
  admin: [
    { group: 'Overview', links: [['/dash', 'Overview', 'chart']] },
    { group: 'Front desk', links: [['/desk', 'Front desk', 'desk'], ['/messages', 'Messages', 'chat'], ['/register', 'Intake', 'inbox'], ['/items', 'Item list', 'list'], ['/storage', 'Storage', 'shelf']] },
    { group: 'Management', links: [['/users', 'People', 'users'], ['/reports', 'Insights', 'pie'], ['/wall', 'Thank-you wall', 'heart'], ['/settings', 'Settings', 'gear']] },
    { group: 'Account', links: [['/profile', 'Account', 'user'], [GUIDE_URL, 'How it works', 'other']] },
  ],
  super: [
    { group: 'Platform', links: [['/orgs', 'Platform', 'globe']] },
    { group: 'Account', links: [['/profile', 'Account', 'user']] },
  ],
};

/** Label for an item status (1-5 are the steps; 6 = closed without the owner, e.g. handed to police). */
export const statusName = (status: number) => (status === 6 ? 'Closed' : STEPS[status - 1] ?? '');

/** Japan's Lost Property Act: a facility reports found items to the police within 1 week of receiving them. */
export const POLICE_DAYS = 7;
/** Ways an item can leave the office without its owner. */
export const DISPOSAL_METHODS = ['Handed to police', 'Donated', 'Recycled', 'Disposed'];

/** Days an unclaimed found item is kept before it expires (MOCK until settings are saved in the database). */
export const STORAGE_DAYS = 90;
/** Items one shelf holds. */
export const SHELF_CAPACITY = 10;

/** Largest photo the browser accepts before sending it (the server also checks). */
export const MAX_PHOTO_BYTES = 1_500_000;

/** Categories hidden from Found items when an organization turns on "Hide sensitive items". */
export const SENSITIVE_CATEGORIES = ['Wallet', 'ID card', 'IC card / pass', 'Smartphone'];
/** Allowed values for the Settings page. */
export const SETTING_LIMITS = { storageDays: [30, 60, 90, 180, 365], policeDays: { min: 1, max: 14 }, keepDays: { min: 1, max: 14 }, listMax: 40, itemMax: 50, shelfMax: 10 };
/** Default: a finder may keep a found item this many days, then must bring it to the office (Settings). */
export const FINDER_KEEP_DAYS = 5;

/** Kinds of notification. Each user chooses per kind: in the app, by email, or both. */
export type NotifyEvent = 'matches' | 'claims' | 'thanks' | 'messages' | 'items' | 'alerts';
export type NotifyPrefs = Record<NotifyEvent, { app: boolean; email: boolean }>;
export const NOTIFY_EVENTS: { key: NotifyEvent; label: string; sub: string; staff: boolean; member: boolean }[] = [
  { key: 'matches', label: 'Matches', sub: 'A found item may be the one you lost', member: true, staff: false },
  { key: 'claims', label: 'Claims and pickup', sub: 'Pickup codes, decisions, and claims on items you found', member: true, staff: true },
  { key: 'thanks', label: 'Thank-you letters', sub: 'Letters, gifts and reactions', member: true, staff: false },
  { key: 'messages', label: 'Messages', sub: 'New chat messages', member: true, staff: true },
  { key: 'items', label: 'Found items to check', sub: 'Members posted or handed in a found item', member: false, staff: true },
  { key: 'alerts', label: '"Have you seen this?" alerts', sub: 'Someone lost something in a building you watch', member: true, staff: false },
];
/** Members get emails by default; staff only in the app (the whole office would get every email). */
export const defaultNotifyPrefs = (staff: boolean): NotifyPrefs => ({
  matches: { app: true, email: !staff }, claims: { app: true, email: !staff }, thanks: { app: true, email: !staff },
  messages: { app: true, email: !staff }, items: { app: true, email: false }, alerts: { app: true, email: false },
});


/** Kinds of organization the super admin can add. */
export const ORG_TYPES = ['School', 'Company', 'Store', 'Other'];

/** Thank-you points (recognition only: never bought, never exchanged for money or goods). */
export type PointReason = 'handed_in' | 'on_time' | 'returned' | 'thanks' | 'wrote_thanks';
export const POINT_RULES: Record<PointReason, number> = { handed_in: 20, on_time: 10, returned: 30, thanks: 0, wrote_thanks: 5 };
export const POINT_REASONS: Record<PointReason, string> = {
  handed_in: 'Brought a found item to the office',
  on_time: 'Brought it within the time limit',
  returned: 'The owner got the item back',
  thanks: 'Thank-you points from the owner',
  wrote_thanks: 'Wrote a thank-you letter',
};
/** What an owner can add to a thank-you letter. */
export const THANKS_POINTS = [0, 10, 30, 50];
export const POINT_LEVELS = [
  { min: 0, name: 'Newcomer', icon: '🌱' },
  { min: 30, name: 'Helper', icon: '🥉' },
  { min: 100, name: 'Silver helper', icon: '🥈' },
  { min: 250, name: 'Gold helper', icon: '🥇' },
  { min: 500, name: 'Campus hero', icon: '🏆' },
];

/** Badges (worked out from what people did; nothing to buy). */
export const BADGES = [
  { key: 'first_find', icon: '🔍', name: 'First find', desc: 'Posted your first found item' },
  { key: 'first_return', icon: '🤝', name: 'First return', desc: 'An item you found went back to its owner' },
  { key: 'five_returns', icon: '⭐', name: 'Five returns', desc: '5 items you found went back to their owners' },
  { key: 'on_time', icon: '⏱️', name: 'Always on time', desc: 'Brought 3 items to the office within the time limit' },
  { key: 'lifesaver', icon: '🛟', name: 'Lifesaver', desc: 'Returned a wallet, ID card, IC card or phone' },
  { key: 'sharp_eyes', icon: '👀', name: 'Sharp eyes', desc: 'Told an owner where you saw their item' },
  { key: 'grateful', icon: '💌', name: 'Grateful heart', desc: 'Wrote a thank-you letter' },
  { key: 'helper_month', icon: '🏅', name: 'Helper of the month', desc: 'Earned the most points in a month' },
] as const;
export type BadgeKey = (typeof BADGES)[number]['key'];


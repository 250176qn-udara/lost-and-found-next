import type { Role } from './types';

export const STEPS = ['Reported', 'Registered', 'Matched', 'Verified', 'Returned'];
export const COLORS = ['#2563eb', '#0d9488', '#6366f1', '#d97706', '#64748b'];

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
    { group: 'Menu', links: [['/home', 'Home', 'home'], ['/report', 'Report an item', 'plus'], ['/my-items', 'My items', 'box'], ['/browse', 'Found items', 'search'], ['/messages', 'Messages', 'chat']] },
    { group: 'Account', links: [['/profile', 'Account', 'user'], [GUIDE_URL, 'How it works', 'other']] },
  ],
  staff: [
    { group: 'Front desk', links: [['/desk', 'Front desk', 'desk'], ['/messages', 'Messages', 'chat'], ['/register', 'Intake', 'inbox'], ['/items', 'Item list', 'list'], ['/storage', 'Storage', 'shelf']] },
    { group: 'Account', links: [['/profile', 'Account', 'user'], [GUIDE_URL, 'How it works', 'other']] },
  ],
  admin: [
    { group: 'Overview', links: [['/dash', 'Overview', 'chart']] },
    { group: 'Front desk', links: [['/desk', 'Front desk', 'desk'], ['/messages', 'Messages', 'chat'], ['/register', 'Intake', 'inbox'], ['/items', 'Item list', 'list'], ['/storage', 'Storage', 'shelf']] },
    { group: 'Management', links: [['/users', 'People', 'users'], ['/reports', 'Insights', 'pie'], ['/settings', 'Settings', 'gear']] },
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
export const SETTING_LIMITS = { storageDays: [30, 60, 90, 180, 365], policeDays: { min: 1, max: 14 }, listMax: 40, itemMax: 50, shelfMax: 10 };

/** Kinds of notification. Each user chooses per kind: in the app, by email, or both. */
export type NotifyEvent = 'matches' | 'claims' | 'thanks' | 'messages' | 'items';
export type NotifyPrefs = Record<NotifyEvent, { app: boolean; email: boolean }>;
export const NOTIFY_EVENTS: { key: NotifyEvent; label: string; sub: string; staff: boolean; member: boolean }[] = [
  { key: 'matches', label: 'Matches', sub: 'A found item may be the one you lost', member: true, staff: false },
  { key: 'claims', label: 'Claims and pickup', sub: 'Pickup codes, decisions, and claims on items you found', member: true, staff: true },
  { key: 'thanks', label: 'Thank-you letters', sub: 'Letters, gifts and reactions', member: true, staff: false },
  { key: 'messages', label: 'Messages', sub: 'New chat messages', member: true, staff: true },
  { key: 'items', label: 'Found items to check', sub: 'Members posted or handed in a found item', member: false, staff: true },
];
/** Members get emails by default; staff only in the app (the whole office would get every email). */
export const defaultNotifyPrefs = (staff: boolean): NotifyPrefs => ({
  matches: { app: true, email: !staff }, claims: { app: true, email: !staff }, thanks: { app: true, email: !staff },
  messages: { app: true, email: !staff }, items: { app: true, email: false },
});


/** Kinds of organization the super admin can add. */
export const ORG_TYPES = ['School', 'Company', 'Store', 'Other'];

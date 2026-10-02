import type { Role } from './types';

export const STEPS = ['Reported', 'Registered', 'Matched', 'Verified', 'Returned'];
export const COLORS = ['#2563eb', '#0d9488', '#6366f1', '#d97706', '#64748b'];

export const CATEGORIES = ['Wallet', 'Bag', 'Electronics', 'ID card', 'Keys', 'Other'];
export const BROWSE_CATEGORIES = ['All', 'Wallet', 'Bag', 'Electronics', 'ID card', 'Other'];
export const SHELVES = ['A-01', 'A-02', 'B-01', 'B-02'];
export const ID_TYPES = ['Student ID', 'Driver’s license', 'My Number card', 'Passport'];

export const ROLE_NAMES: Record<Role, string> = {
  member: 'Member',
  staff: 'Staff',
  admin: 'Org admin',
  super: 'Super admin',
};

export type NavGroup = { group: string; links: [href: string, label: string, icon: string][] };

/** Sidebar menus. Each entry is a hub page; its sections are tabs or expandable cards inside the page. */
export const NAV: Record<Role, NavGroup[]> = {
  member: [
    { group: 'Menu', links: [['/home', 'Home', 'home'], ['/report', 'Report an item', 'plus'], ['/my-items', 'My items', 'box'], ['/browse', 'Found items', 'search']] },
    { group: 'Account', links: [['/profile', 'Account', 'user']] },
  ],
  staff: [
    { group: 'Front desk', links: [['/desk', 'Front desk', 'desk'], ['/register', 'Intake', 'inbox'], ['/items', 'Item list', 'list'], ['/storage', 'Storage', 'shelf']] },
    { group: 'Account', links: [['/profile', 'Account', 'user']] },
  ],
  admin: [
    { group: 'Overview', links: [['/dash', 'Overview', 'chart']] },
    { group: 'Front desk', links: [['/desk', 'Front desk', 'desk'], ['/register', 'Intake', 'inbox'], ['/items', 'Item list', 'list'], ['/storage', 'Storage', 'shelf']] },
    { group: 'Management', links: [['/users', 'People', 'users'], ['/reports', 'Insights', 'pie'], ['/settings', 'Settings', 'gear']] },
    { group: 'Account', links: [['/profile', 'Account', 'user']] },
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

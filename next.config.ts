import type { NextConfig } from 'next';

// Screens that were merged into the hub pages. Old links (bookmarks, notifications) keep working.
const MOVED: [from: string, to: string][] = [
  ['/queue', '/desk?tab=finders'], ['/claims', '/desk'], ['/handover', '/desk?tab=pickups'], ['/scan', '/register?tab=lookup'],
  ['/matches', '/my-items'], ['/pickup', '/my-items?tab=claims'], ['/history', '/my-items?tab=claims'], ['/rewards', '/my-items'],
  ['/map', '/browse?view=map'], ['/messages', '/home'], ['/help', '/profile?tab=help'],
  ['/alerts', '/dash'], ['/item-history', '/items'], ['/match-review', '/items?tab=matches'],
  ['/expiry', '/storage?tab=deadlines'], ['/disposal', '/storage?tab=closed'],
  ['/roles', '/users'], ['/staff-activity', '/users?tab=activity'],
  ['/hotspots', '/reports?tab=hotspots'], ['/audit', '/reports?tab=audit'], ['/reward-rules', '/settings'],
  ['/platform', '/orgs'], ['/system-audit', '/orgs?tab=audit'],
];

const nextConfig: NextConfig = {
  experimental: {
    // Photos are sent to Server Actions as form data (up to 1.5 MB, checked in the browser).
    serverActions: { bodySizeLimit: '2mb' },
  },
  async redirects() {
    return MOVED.map(([source, destination]) => ({ source, destination, permanent: false }));
  },
};

export default nextConfig;

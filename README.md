# Lost & Found (Next.js)

A Lost & Found system for organizations such as schools, companies and stores.
Team: Cyber6 (graduation project).

This is the Next.js + TypeScript version of the earlier HTML/JS + PHP prototype.
It uses the same MySQL database (`database/schema.sql`), so existing data and demo accounts still work.

## Run it

Requirements: Node.js 20.9 or newer, and MySQL (Laragon / XAMPP is fine).

1. Import `database/schema.sql` once (phpMyAdmin > Import, or `mysql -u root < database/schema.sql`).
2. Copy `.env.example` to `.env.local`. Set the database settings and a `SESSION_SECRET` of at least 32 characters.
3. Install and start:

   ```
   npm install
   npm run dev
   ```

4. Open http://localhost:3000

Demo accounts (password `123456`):

| Email | Role |
|---|---|
| aiko@example.com | Member (Yokohama Demo School) |
| sara@example.com | Staff (Yokohama Demo School) |
| yamada@example.com | Org admin (Yokohama Demo School) |
| harbor@example.com / nexa@example.com | Org admin (other organizations) |

## Pages

Each menu entry is a hub; its sections are tabs (`?tab=...`) or cards that open when clicked.
Old screen URLs (e.g. `/queue`, `/matches`, `/audit`) redirect to their new place (see `next.config.ts`).

| Role | Menu |
|---|---|
| Member | Home · Report an item (5-step wizard) · My items (lost / found / claims, with matches, pickup pass and hand-over inside each card) · Found items (grid or map) · Account (profile, community, privacy & data, how it works) |
| Staff | Front desk (verify claims / pickups / from finders) · Intake (register / look up by code) · Item list (all items / matches / map) · Storage (shelves / deadlines / closed items) · Account |
| Org admin | Overview (numbers + to-do) · the staff pages · People (members & roles / staff activity) · Insights (monthly report / hotspots / audit log) · Settings · Account |
| Super admin | Platform (organizations / system audit) — no super admin role in the database yet |

The bell in the top bar shows unread notifications (read state is kept in the browser).

## How it works (based on real lost-and-found systems)

- **Lost / found.** A member reports "I lost something" or posts "I found something". A found item is listed for the
  whole community at once, with an item code.
- **Private details.** A found item's colour, brand, marks and description are visible only to staff and the finder.
  Other members see the name, category, place and date. The claimant must describe the item, and staff compare that
  with the private details on the Front desk (the "hidden information" idea used by systems like Crowdfind).
- **Finder hand-in.** When someone claims a found item, the finder is notified and presses "Hand over to the office"
  after giving it to staff. Staff confirm it with a shelf. Walk-in items are registered in Intake.
- **Pickup code.** When staff approve a claim, the owner gets a 6-digit pickup code on their pickup pass. At handover
  staff enter the code and check a photo ID.
- **Legal deadlines (Japan).** Under the Lost Property Act (遺失物法) a facility reports found items to the police within
  one week of receiving them. Storage → Deadlines shows the police date for each item; "Close item" records it as
  handed to the police (or donated, recycled, disposed). Closed items stay in the records (status 6).

## Files

```
database/schema.sql          MySQL tables and demo data
src/app/(app)/<page>/        one folder per page (page.tsx loads data on the server)
src/app/login, signup        login and sign-up
src/app/actions.ts           every write (report, register, claim, approve, hand over ...)
src/app/api/items/[id]/photo item photos
src/lib/auth.ts              login state and page/role checks
src/lib/data.ts              read queries
src/lib/items.ts             matching rules
src/lib/i18n.ts              translations (English text is the key; edit the Japanese on the right)
src/proxy.ts                 30-minute session timeout
src/app/globals.css          all styles
```

## How it maps to the PHP version

| PHP prototype | Next.js |
|---|---|
| `js/app.js` views (`V.home`, ...) | Pages under `src/app/(app)/` |
| `api/index.php?action=...` (POST) | Server Actions in `src/app/actions.ts` |
| `api/index.php?action=...` (GET) | Queries in `src/lib/data.ts`, called from the pages |
| PHP session + CSRF token | Encrypted cookie (`iron-session`); Next.js checks the origin of every Server Action |
| DOM text translation | `t('...')` calls with the same dictionary |

## Notes

- Dashboard, Settings and Organizations still show sample data.
- The storage label is a visual placeholder. Scan item works by typing an item code (e.g. `LF-2026-0002` after registering item 2).

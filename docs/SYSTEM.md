# Lost & Found — System Documentation

Graduation project by team **Cyber6**, built for **横浜システム工学院専門学校 (YSE)**.
A web system where students and staff report lost items, post found items, and get them back to their owners
safely, from the first report to a thank-you letter.

- Stack: Next.js 16 (App Router, Server Components, Server Actions) · TypeScript · MySQL · Tailwind + plain CSS
- Languages: Japanese and English (switch in the top bar)
- State of this document: October 2026

---

## 1. Quick start

Requirements: Node.js 20.9+, MySQL (Laragon / XAMPP).

1. Create the database: `mysql -u root < database/schema.sql` (or phpMyAdmin → Import).
2. Copy `.env.example` to `.env.local`, set the database settings and a `SESSION_SECRET` (32+ characters).
3. `npm install`, then `npm run dev`, then open http://localhost:3000

Demo accounts (password `123456`):

| Email | Role |
|---|---|
| aiko@example.com | Member |
| sara@example.com | Staff |
| yamada@example.com | Org admin |
| harbor@example.com / nexa@example.com | Org admin of the other demo organizations |
| super@example.com | Super admin (runs the platform, belongs to no organization) |

**Dev login:** with `DEV_LOGIN=1` in `.env.development.local`, the login page lists every account and logs in by
name without a password. Development only; never set it on a real server.

### Settings (`.env.local`)

| Variable | Needed? | What it does |
|---|---|---|
| `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` | Yes | MySQL connection |
| `SESSION_SECRET` | Yes | Encrypts the login cookie (32+ random characters) |
| `GEMINI_API_KEY` | Optional | Turns on the AI features (§6). Free key: https://aistudio.google.com/apikey |
| `GEMINI_MODEL` | Optional | Pins a model. Default `gemini-flash-latest` |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM` | Optional | Real email sending. Without them, emails are saved as `.eml` files in `mail-outbox/` |
| `APP_URL` | Optional | Base URL used in email links (default `http://localhost:3000`) |
| `CRON_SECRET` | Optional | Key for `/api/cron/reminders` (finder reminders on a schedule) |

Restart the app after changing `.env.local`. Never commit `.env.local`.

---

## 2. Roles and menus

| Role | Menu |
|---|---|
| **Member** (student) | Home · Report an item · My items · Found items · Messages · Account · How it works |
| **Staff** (office) | Front desk · Messages · Intake · Item list · Storage · Account |
| **Org admin** | Overview · the staff pages · People · Insights · Settings · Account |
| **Super admin** | Platform: all organizations with their admins and numbers, **Add organization**, system audit log |

Pages are hubs: their sections are tabs (`?tab=...`). Old screen URLs redirect to their new place (`next.config.ts`).

---

## 3. The journey of an item

Every item card shows a **journey bar** (7 steps) and a **"Next: who does what"** box, so each person always knows
whether it is their turn.

```
Owner reports "I lost something"          Finder posts "I found something"
            \                                   /
             └──── system suggests a match ────┘   (rules, or Gemini AI when a key is set)
                              │
              Owner presses "This is mine" and describes the item
                              │
          Staff compare the answers with the private details   ← can ask questions in Messages
                              │ approve
      Owner gets a 6-digit pickup code     Finder gets "thank you, please bring it to the office"
                              │
          Finder hands it in → staff confirm and put it on a shelf (QR label printed)
                              │
     Owner comes with photo ID + pickup code → staff check both → item returned
                              │
         Owner writes a thank-you letter (required), optional points → finder can react
```

Item status: 1 Reported · 2 Registered · 3 Matched · 4 Verified · 5 Returned · 6 Closed (left without its owner).
Claim status: pending · approved · rejected · returned.

---

## 4. Features

### Reporting
- 5-step wizard: type → item → where & when → photo → review.
- **Fill in from a photo (AI):** take a photo and Gemini suggests name, category, colour, brand and marks (§6).
- A found item is listed for the whole community at once, with an item code (`LF-2026-0001`).
- **Private details:** a found item's colour, brand, marks and description are seen only by staff and the finder.
  Other members see name, category, place and date. The owner must describe the item to claim it.

### Places and maps
- **Campus floor plan:** A号館 / B号館 drawn floor by floor (3F … B1F) from the place names. Used to pick the place
  in the report form, to browse found items per room, for hotspots, and on each item page.
- Admins manage places in **Settings → Places & shelves**. Name rooms `Bldg A · Lab 2F` (building · room floor) so
  they appear on the right floor. Names without a floor go under "Floor not set".
- **Street map:** OpenStreetMap (free, no key) for places outside the buildings. Optional pin per place.

### Matching
- **Rules:** same category and (same place, pins within 150 m, or same date). Score shown to the owner.
- **AI (with a Gemini key):** compares the new report with up to 8 candidates using text and photos; can match
  across places and categories. Owners see the score and "Checked by AI"; only staff see the AI's reason, because it
  may mention private details. Staff can remove wrong matches or link items by hand (Item list → Matches).

### Finder time limit and reminders
- A finder who posts a found item in the app may keep it for **5 days** (Settings → "Finder may keep a found item
  for", 1–14 days). Then it must go to the office, **even if nobody has claimed it**.
- The finder sees the limit on the report form, the result screen, My items and the item page
  ("Bring it to the office by …", red once it has passed). "Hand over to the office" is always available.
- **Automatic reminders** (chat message from the office + email): the day before the limit, and when it has passed.
  Each is sent once (`items.keep_reminder`). Staff get a notification "A finder has not handed an item in on time".
- They run after pages load (at most every 10 minutes). For a fixed schedule, set `CRON_SECRET` and call
  `/api/cron/reminders?key=<CRON_SECRET>` every hour (Windows Task Scheduler or cron).
- Items registered at Intake are already at the office, so no limit applies.

### Claims, pickup and handover (Front desk)
- Staff see the owner's answers next to the private details and can ask questions; the conversation is in Messages
  and on the claim card.
- **Approve:** a 6-digit pickup code is created and sent to the owner (app + email). If the finder still has the
  item, they get a thank-you and are asked to bring it to the office.
- **Handover:** staff check a photo ID (type chosen from the organization's list) and type the pickup code. A wrong
  code is refused.

### QR codes
- Every item code has a real QR code: on a printable **label** (`/label/<id>`, offered right after Intake), on the
  item page and on the owner's pickup pass.
- **Intake → Look up by code:** scan with the camera, from a photo of the label, with a USB scanner, or type the code.
  The camera needs `https://` or `localhost`.

### Messages and notifications
- Chat between each member and the office. Claim questions are part of the same conversation.
- Notifications are built from what happened to the user's items; read/unread is saved per user.
- **Emails** (Japanese + English): possible match, claim approved (with pickup code) or not approved, office messages,
  someone claimed your found item, please bring the item to the office, thank-you letter received (with gift code).
  Staff can turn on emails for new claims, member messages and found items to check.
- Each user chooses per kind: in-app and/or email (Notifications → Notification settings).

### Thank-you letters and points
- After a return, the owner writes a letter to the finder (required) and may add **thank-you points** (0 / 10 / 30 / 50).
  The finder can react with an emoji.
- **Points** (recognition only: free, never bought, never exchanged for money or goods, so they are not a prepaid
  payment instrument under 資金決済法):

  | When | Who | Points |
  |---|---|---|
  | Staff confirm a found item reached the office | Finder | +20 |
  | ...within the time limit (5 days) | Finder | +10 |
  | The owner got it back | Finder | +30 |
  | Thank-you points in the letter | Finder | 0–50 |
  | Wrote the thank-you letter | Owner | +5 |

  Points are given only when staff confirm a step, once per person, reason and item; staff do not earn points.
- Levels: Newcomer (0) · Helper (30) · Silver helper (100) · Gold helper (250) · Campus hero (500).
- **My items → Points** shows the total, level, history and the **Top helpers** ranking; Home shows a summary.
  Members can leave the ranking (Account → Privacy).
- The paid e-gift (PAY.JP) was replaced by points on our teacher's advice: real money needs a merchant contract, a
  gift-card supplier and legal pages. The old code (`src/lib/payjp.ts`, `src/lib/gift-provider.ts`) is no longer used.

### "Have you seen this?" alerts
- When reporting something lost, the owner can **ask others to look out for it** (on by default). Only the item name,
  category, place, date and photo are shared, never the owner's name or private details.
- Members choose buildings to watch (Found items → **Seen these?**). They get a notification (email only if they turn it
  on) when something is lost there in the last 14 days.
- **I saw it:** a short note to the owner (where/when). The owner never sees who sent it. **I found it** opens the
  found-item report.

### Thank-you wall, badges, Helper of the month
- **Thank-you wall** (menu): anonymous stories of returns ("A wallet went back to its owner in Bldg B, thanks to a
  🥉 Helper"), only when the owner agreed in the letter (on by default). Members clap 👏. Shows how many items went
  back this month.
- **Badges** (My items → Points): First find, First return, Five returns, Always on time, Lifesaver (wallet, ID card,
  IC card or phone), Sharp eyes (sent an "I saw it" note), Grateful heart (wrote a letter), Helper of the month.
- **Helper of the month:** most points last month (members who opted out of the ranking are skipped). Shown on the
  wall, with a printable **certificate (感謝状)** at `/certificate/YYYY-MM` the school can hand over.

### Storage and the law
- Shelves, storage period and police deadline per item (Storage → Deadlines).
- Under the **Lost Property Act (遺失物法)** a facility reports found items to the police within one week. "Close item"
  records how an item left (handed to police, donated, recycled, disposed); closed items stay on record.

### Settings (admins)
- Storage period (30–365 days), police report deadline (1–14 days), hide sensitive items (wallets, ID cards,
  IC cards, phones) from Found items, categories, shelves, accepted ID types, places.

### Platform (super admin)
- A super admin is a user with `users.is_super = 1`. They belong to no organization; organization pages send them back
  to Platform.
- **Add organization:** name, type, description and the first administrator. Use the email of an existing account
  that is not in another organization, or enter a name and email to create a new account with a one-time password,
  shown once and emailed to the new admin (who should change it under Account). The organization starts with default
  settings; its admin then adds rooms, categories, shelves, staff and members.

### Privacy and account
- **Show my email to staff:** on/off. When off, staff contact the member through Messages.
- Finders never see who claimed their item; members never see other people's lost reports.
- **Download my data** (JSON) and **Delete my account**. Deleting anonymizes the account: name, email, lost reports,
  open claims and messages are removed; items at the office, returns and thank-you letters stay on record without the
  name, as the law requires. Refused while it would leave someone stuck (only admin, item waiting for pickup, claimed
  item not yet handed in).

---

## 5. Database

Defined in `database/schema.sql` (tables, demo data, and upgrade notes at the bottom).

| Table | Holds |
|---|---|
| `users` | Accounts (bcrypt password hash; `deleted_at` for deleted accounts; `is_super` for the super admin) |
| `organizations`, `organization_members` | Communities and who belongs with which role |
| `places` | Each organization's rooms and places (optional map pin) |
| `items` | Lost reports and found items (photo, private details, shelf, match, AI score/reason, disposal) |
| `claims` | "This is mine" requests, decision, pickup code, handover |
| `thanks` | Thank-you letters, thank-you points, reaction |
| `points` | Points ledger (one row per person, reason and item) |
| `sightings` | "I saw it" notes to owners of lost items |
| `wall_claps` | 👏 on thank-you wall stories |
| `office_messages` | Member ↔ office chat (optionally tied to an item) |
| `org_settings` | Saved Settings per organization |
| `notice_reads`, `user_prefs` | Read notifications; notification and privacy choices per user |

### Updating an existing database

If your database was created from an older `schema.sql`, run the matching lines from the bottom of the file.
The changes from October 2026:

```sql
-- saved Settings, notifications, privacy: run the CREATE TABLE blocks for
--   org_settings, notice_reads, user_prefs from schema.sql
ALTER TABLE users ADD COLUMN deleted_at DATETIME NULL AFTER password_hash;
ALTER TABLE items ADD COLUMN ai_score TINYINT UNSIGNED NULL, ADD COLUMN ai_reason VARCHAR(300) NULL;
ALTER TABLE users ADD COLUMN is_super TINYINT(1) NOT NULL DEFAULT 0 AFTER deleted_at;
ALTER TABLE items ADD COLUMN keep_reminder TINYINT UNSIGNED NOT NULL DEFAULT 0;
ALTER TABLE org_settings ADD COLUMN finder_keep_days TINYINT UNSIGNED NOT NULL DEFAULT 5 AFTER police_days;
-- thank-you points: run the CREATE TABLE points block from schema.sql, then
ALTER TABLE thanks ADD COLUMN points SMALLINT UNSIGNED NOT NULL DEFAULT 0;
ALTER TABLE user_prefs ADD COLUMN show_in_ranking TINYINT(1) NOT NULL DEFAULT 1;
-- alerts and the thank-you wall: run the CREATE TABLE sightings / wall_claps blocks from schema.sql, then
ALTER TABLE items ADD COLUMN ask_help TINYINT(1) NOT NULL DEFAULT 0;
ALTER TABLE user_prefs ADD COLUMN alert_areas TEXT NULL;
ALTER TABLE thanks ADD COLUMN on_wall TINYINT(1) NOT NULL DEFAULT 0;
-- then add the super admin account: the INSERT ... 'super@example.com' line in schema.sql
```

After pulling new code, also run `npm install` (new packages: `qrcode-generator`, `jsqr`, `leaflet`).

---

## 6. AI (Google Gemini)

| | |
|---|---|
| Key | `GEMINI_API_KEY` (free, from Google AI Studio) |
| Model | `gemini-flash-latest` unless `GEMINI_MODEL` is set |
| Code | `src/lib/gemini.ts` |
| Photo → form | `suggestFromPhoto` action, `src/components/AiPhotoFill.tsx` |
| Matching | `findMatch` in `src/lib/items.ts` (AI first, rules as fallback) |

- Answers are requested as JSON with a fixed schema; the category must be one of the organization's categories.
- Gemini must score a new suggestion at least 70; a rule-based match is dropped if Gemini scores it below 50.
- Time limits (20–25 s) and errors fall back to the rules, so the app never waits on the AI or breaks.
- **Free tier:** Google may use what is sent to improve its products, and there is a per-minute request limit.
  Prompts tell Gemini not to copy names or ID numbers into its answers.

---

## 7. Integrations

| Service | Use | Without it |
|---|---|---|
| Gemini | Photo → form, AI matching | Rule-based matching, manual forms |
| SMTP (e.g. Gmail app password) | Email notifications | Emails saved in `mail-outbox/` |
| OpenStreetMap | Street map tiles | — (no key needed) |

---

## 8. Code map

```
database/schema.sql            tables, demo data, upgrade notes
src/app/(app)/<page>/          one folder per page (page.tsx loads data on the server)
src/app/actions.ts             every write (report, claim, approve, hand over, settings, delete account ...)
src/app/label/[id]/            printable QR label
src/app/api/items/[id]/photo   item photos
src/app/api/me/export          "Download my data"
src/lib/auth.ts                login state, role checks
src/lib/data.ts                read queries, notifications
src/lib/items.ts, match.ts     matching and match score
src/lib/gemini.ts              Gemini API
src/lib/prefs.ts               notification/privacy preferences, notification emails
src/lib/settings.ts            organization settings
src/lib/mail.ts                SMTP / mail-outbox
src/lib/journey.ts             journey steps and "who does what next"
src/lib/i18n.ts                translations (English key → Japanese)
src/components/                FloorPlan, MapView, QrCode, QrScanner, AiPhotoFill, Journey, ...
public/how-it-works.html       the illustrated guide
docs/                          demo, 卒業制作要旨, this document
```

---

## 9. Security

- Passwords hashed with bcrypt; login cookie encrypted (`iron-session`), 30-minute idle timeout (`src/proxy.ts`).
- Next.js checks the origin of every Server Action; every action re-checks the user's role and organization.
- Private details and the AI's reasons are only sent to staff and the finder.
- No money moves through the app: thank-you points cannot be bought or exchanged.
- Photos are served only to members of the same organization.

---

## 10. Testing

Automated browser tests are run against a separate `lf_test` database on port 3123: the 10-step demo story
(report → match → claim → question → approve → hand in → shelf → handover → letter → reaction), plus checks for
settings, notifications and emails, QR labels and scanning, account deletion, Gemini (against a fake Gemini server),
the floor plan, the street map, and the super admin (adding organizations, new admin login).

---

## 11. Not done yet

- **Real Gemini check:** the AI features were tested against a fake server; check one photo and one match with a real key.
- **Real email:** set SMTP to send instead of saving to `mail-outbox/`.
- **Floors for some places:** add the floor to places shown under "Floor not set".
- **Shared database for the team:** each PC has its own database now.
- **Next.js update:** `npm audit` reports advisories for the installed Next.js 16.0.x; update within version 16.

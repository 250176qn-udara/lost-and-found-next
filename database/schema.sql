-- Lost & Found — database (same schema as the PHP version)
-- Import once: phpMyAdmin > Import, or:  mysql -u root < database/schema.sql

CREATE DATABASE IF NOT EXISTS lost_and_found CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE lost_and_found;

CREATE TABLE IF NOT EXISTS users (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(100) NOT NULL,
  email         VARCHAR(190) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,            -- bcrypt hash, never the plain password
  deleted_at    DATETIME NULL,                    -- "Delete my account": name/email replaced, can never log in again
  is_super      TINYINT(1) NOT NULL DEFAULT 0,    -- super admin: runs the platform (adds organizations), belongs to none
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS organizations (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(150) NOT NULL,
  type        VARCHAR(50)  NOT NULL DEFAULT 'School',   -- School / Store / Company
  description TEXT NULL,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- One row per membership request. A user may have several rows over time
-- (rejected, left, approved), but only one 'approved' row is the current community.
CREATE TABLE IF NOT EXISTS organization_members (
  id              INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id         INT UNSIGNED NOT NULL,
  organization_id INT UNSIGNED NOT NULL,
  status          ENUM('pending','approved','rejected','left') NOT NULL DEFAULT 'pending',
  role            ENUM('member','staff','admin') NOT NULL DEFAULT 'member',
  requested_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  approved_at     TIMESTAMP NULL DEFAULT NULL,
  approved_by     INT UNSIGNED NULL DEFAULT NULL,
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_org_status  (organization_id, status),
  INDEX idx_user_status (user_id, status),
  CONSTRAINT fk_om_user FOREIGN KEY (user_id)         REFERENCES users(id)         ON DELETE CASCADE,
  CONSTRAINT fk_om_org  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  CONSTRAINT fk_om_by   FOREIGN KEY (approved_by)     REFERENCES users(id)         ON DELETE SET NULL
) ENGINE=InnoDB;

-- Demo data (all demo passwords are: 123456)
INSERT IGNORE INTO organizations (id, name, type, description) VALUES
  (1, 'Yokohama System Engineering College', 'School', '横浜システム工学院専門学校 · 〒241-0826 横浜市旭区東希望が丘128-4'),
  (2, 'Harbor Mart',          'Store',   'Demo store'),
  (3, 'Nexa Systems',         'Company', 'Demo company');

INSERT IGNORE INTO users (id, name, email, password_hash) VALUES
  (1, 'Aiko Tanaka',  'aiko@example.com',   '$2y$10$U8BOoJfma/aJ4Kx0QGpf.OHQByOo0.7w1P.Wrz6Q4rix3nUN6L6EG'),
  (2, 'Mr. Yamada',   'yamada@example.com', '$2y$10$U8BOoJfma/aJ4Kx0QGpf.OHQByOo0.7w1P.Wrz6Q4rix3nUN6L6EG'),
  (3, 'Harbor Admin', 'harbor@example.com', '$2y$10$U8BOoJfma/aJ4Kx0QGpf.OHQByOo0.7w1P.Wrz6Q4rix3nUN6L6EG'),
  (4, 'Nexa Admin',   'nexa@example.com',   '$2y$10$U8BOoJfma/aJ4Kx0QGpf.OHQByOo0.7w1P.Wrz6Q4rix3nUN6L6EG'),
  (5, 'Sara Ito',     'sara@example.com',   '$2y$10$U8BOoJfma/aJ4Kx0QGpf.OHQByOo0.7w1P.Wrz6Q4rix3nUN6L6EG');

-- The platform's super admin (no organization).
INSERT IGNORE INTO users (id, name, email, password_hash, is_super) VALUES
  (7, 'Platform Admin', 'super@example.com', '$2y$10$U8BOoJfma/aJ4Kx0QGpf.OHQByOo0.7w1P.Wrz6Q4rix3nUN6L6EG', 1);

INSERT IGNORE INTO organization_members (id, user_id, organization_id, status, role, approved_at) VALUES
  (1, 1, 1, 'approved', 'member', NOW()),
  (2, 2, 1, 'approved', 'admin',  NOW()),
  (3, 3, 2, 'approved', 'admin',  NOW()),
  (4, 4, 3, 'approved', 'admin',  NOW()),
  (5, 5, 1, 'approved', 'staff',  NOW());

-- Places each organization uses on its forms and map (admins manage them in Settings).
CREATE TABLE IF NOT EXISTS places (
  id              INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  organization_id INT UNSIGNED NOT NULL,
  name            VARCHAR(100) NOT NULL,
  lat             DECIMAL(9,6) NULL,
  lng             DECIMAL(9,6) NULL,
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_place (organization_id, name),
  CONSTRAINT fk_place_org FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
) ENGINE=InnoDB;

INSERT IGNORE INTO places (organization_id, name, lat, lng) VALUES
-- YSE campus (A号館 / B号館). All start at the campus pin; admins can move each pin in Settings.
  (1, 'Bldg A · Front entrance', 35.463823, 139.513032),
  (1, 'Bldg A · Entrance hall 1F', 35.463823, 139.513032),
  (1, 'Bldg A · Multi-purpose hall 1F', 35.463823, 139.513032),
  (1, 'Bldg A · Lab 2F', 35.463823, 139.513032),
  (1, 'Bldg A · Lab 3F', 35.463823, 139.513032),
  (1, 'Bldg A · Terrace', 35.463823, 139.513032),
  (1, 'Bldg B · Academic affairs office', 35.463823, 139.513032),
  (1, 'Bldg B · Lab 1F', 35.463823, 139.513032),
  (1, 'Bldg B · Lab 2F', 35.463823, 139.513032),
  (1, 'Bldg B · Lab 3F', 35.463823, 139.513032),
  (1, 'Bldg B · Career center', 35.463823, 139.513032),
  (1, 'Bldg B · Learning commons B1F', 35.463823, 139.513032),
  (2, 'Entrance',  35.454900, 139.631300),
  (2, 'Checkout',  35.455100, 139.631600),
  (3, 'Lobby',     35.681200, 139.767100);

-- Lost & found items (reporting).
CREATE TABLE IF NOT EXISTS items (
  id              INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  organization_id INT UNSIGNED NOT NULL,
  reporter_id     INT UNSIGNED NOT NULL,
  kind            ENUM('lost','found') NOT NULL,
  title           VARCHAR(150) NOT NULL,
  category        VARCHAR(50)  NOT NULL,
  place           VARCHAR(100) NOT NULL,       -- a place from the organization's list, or typed by the user
  lat             DECIMAL(9,6) NULL,           -- map pin (Google Maps), optional
  lng             DECIMAL(9,6) NULL,
  item_date       DATE NULL,
  description     TEXT NULL,
  photo           LONGTEXT NULL,             -- optional image as a data: URL
  status          TINYINT UNSIGNED NOT NULL DEFAULT 1,  -- 1 Reported .. 5 Returned, 6 Closed without owner (see STEPS in src/lib/constants.ts)
  item_code       VARCHAR(20)  NULL UNIQUE,   -- assigned once the item is received at the office, e.g. LF-2026-0148
  shelf           VARCHAR(10)  NULL,
  finder_name     VARCHAR(100) NULL,          -- optional, for found items a staff member logs on someone else's behalf
  received_by     INT UNSIGNED NULL,
  received_at     TIMESTAMP NULL DEFAULT NULL,
  handed_in_at    TIMESTAMP NULL DEFAULT NULL, -- the finder says they handed the item to the office (staff then confirm it)
  disposed_at     TIMESTAMP NULL DEFAULT NULL, -- closed without the owner (status 6): handed to police, donated, ...
  disposal_method VARCHAR(50)  NULL,
  disposal_note   VARCHAR(255) NULL,
  disposed_by     INT UNSIGNED NULL,
  matched_item_id INT UNSIGNED NULL,          -- the item the system suggested as a match
  matched_at      TIMESTAMP NULL DEFAULT NULL,
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_org_kind_status (organization_id, kind, status),
  INDEX idx_reporter (reporter_id),
  CONSTRAINT fk_item_org      FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  ask_help        TINYINT(1) NOT NULL DEFAULT 0,        -- lost report: owner asks others to look out for it (name, category, place, date only)
  keep_reminder   TINYINT UNSIGNED NOT NULL DEFAULT 0, -- finder reminders sent: 1 = day before the limit, 2 = limit passed
  ai_score        TINYINT UNSIGNED NULL,               -- Gemini's 0-100 score for the current match (NULL = rules only)
  ai_reason       VARCHAR(300) NULL,                   -- Gemini's short reason, shown to staff only
  CONSTRAINT fk_item_reporter FOREIGN KEY (reporter_id)     REFERENCES users(id)         ON DELETE CASCADE,
  CONSTRAINT fk_item_received FOREIGN KEY (received_by)     REFERENCES users(id)         ON DELETE SET NULL
) ENGINE=InnoDB;

-- A couple of demo items for the school (org 1), reported by Aiko (user 1).
INSERT IGNORE INTO items (id, organization_id, reporter_id, kind, title, category, place, item_date, description, status) VALUES
  (1, 1, 1, 'lost',  'Black wallet',     'Wallet', 'Bldg B · Learning commons B1F', '2026-09-24', 'Black leather wallet, small scratch', 1),
  (2, 1, 1, 'found', 'Silver earphones', 'Earphones', 'Bldg A · Lab 2F', '2026-09-26', 'In a small case', 2);

-- Found items are registered (status 2, with an item code) as soon as they are reported.
-- Also run this once on an existing database to update found items reported before this change:
UPDATE items SET status = GREATEST(status, 2), item_code = CONCAT('LF-', YEAR(created_at), '-', LPAD(id, 4, '0'))
WHERE kind = 'found' AND item_code IS NULL AND status < 5;

-- Basic (non-AI) matching + claim requests.
-- matched_item_id links a lost item to the found item the system suggested, or vice versa.

CREATE TABLE IF NOT EXISTS claims (
  id              INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  found_item_id   INT UNSIGNED NOT NULL,             -- the found item being claimed
  lost_item_id    INT UNSIGNED NULL,                 -- the claimant's own lost report, if the system suggested this match
  claimant_id     INT UNSIGNED NOT NULL,
  answers         TEXT NOT NULL,                     -- claimant's answers to the verification questions, kept as one block
  pickup_code     CHAR(6) NULL,                      -- given when the claim is approved; the owner tells it to staff at pickup
  status          ENUM('pending','approved','rejected','returned') NOT NULL DEFAULT 'pending',
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  decided_at      TIMESTAMP NULL DEFAULT NULL,
  decided_by      INT UNSIGNED NULL,
  id_type         VARCHAR(50) NULL,                  -- ID shown at handover, e.g. Student ID
  returned_at     TIMESTAMP NULL DEFAULT NULL,
  returned_by     INT UNSIGNED NULL,
  INDEX idx_found (found_item_id, status),
  INDEX idx_claimant (claimant_id),
  CONSTRAINT fk_claim_found    FOREIGN KEY (found_item_id) REFERENCES items(id) ON DELETE CASCADE,
  CONSTRAINT fk_claim_lost     FOREIGN KEY (lost_item_id)  REFERENCES items(id) ON DELETE SET NULL,
  CONSTRAINT fk_claim_claimant FOREIGN KEY (claimant_id)   REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_claim_decided  FOREIGN KEY (decided_by)    REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_claim_returned FOREIGN KEY (returned_by)   REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Thank-you letters from owners to finders (a letter is required; an e-gift is optional and paid by card).
CREATE TABLE IF NOT EXISTS thanks (
  id           INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  claim_id     INT UNSIGNED NOT NULL UNIQUE,      -- the returned claim being thanked (one letter per return)
  from_user    INT UNSIGNED NOT NULL,             -- the owner
  to_user      INT UNSIGNED NOT NULL,             -- the finder (who posted the found item)
  message      TEXT NOT NULL,
  card         VARCHAR(20) NOT NULL DEFAULT 'classic',
  show_name    TINYINT(1) NOT NULL DEFAULT 0,     -- sign the letter with the owner's name
  points       SMALLINT UNSIGNED NOT NULL DEFAULT 0,  -- thank-you points the owner added to the letter
  on_wall      TINYINT(1) NOT NULL DEFAULT 0,         -- the owner allowed an anonymous story on the thank-you wall
  gift_brand   VARCHAR(50) NULL,
  gift_amount  INT UNSIGNED NULL,                 -- yen
  gift_code    VARCHAR(100) NULL,
  charge_id    VARCHAR(64) NULL,                  -- PAY.JP charge id
  created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  read_at      TIMESTAMP NULL DEFAULT NULL,
  reaction     VARCHAR(16) NULL,                  -- the finder's reaction to the letter (an emoji from THANKS_REACTIONS)
  reacted_at   TIMESTAMP NULL DEFAULT NULL,
  INDEX idx_to (to_user),
  CONSTRAINT fk_thanks_claim FOREIGN KEY (claim_id)  REFERENCES claims(id) ON DELETE CASCADE,
  CONSTRAINT fk_thanks_from  FOREIGN KEY (from_user) REFERENCES users(id)  ON DELETE CASCADE,
  CONSTRAINT fk_thanks_to    FOREIGN KEY (to_user)   REFERENCES users(id)  ON DELETE CASCADE
) ENGINE=InnoDB;

-- Chat between a member and their organization's office (staff + admins share one inbox).
CREATE TABLE IF NOT EXISTS office_messages (
  id              INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  organization_id INT UNSIGNED NOT NULL,
  member_id       INT UNSIGNED NOT NULL,             -- whose conversation this is
  sender_id       INT UNSIGNED NULL,                 -- NULL = sent automatically by the system
  from_staff      TINYINT(1) NOT NULL,               -- 1 = office side, 0 = the member
  body            TEXT NOT NULL,
  item_id         INT UNSIGNED NULL,                 -- optional link to an item
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  read_at         TIMESTAMP NULL DEFAULT NULL,       -- when the other side read it
  INDEX idx_thread (organization_id, member_id, id),
  CONSTRAINT fk_om_msg_org    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  CONSTRAINT fk_om_msg_member FOREIGN KEY (member_id)       REFERENCES users(id)         ON DELETE CASCADE,
  CONSTRAINT fk_om_msg_sender FOREIGN KEY (sender_id)       REFERENCES users(id)         ON DELETE SET NULL,
  CONSTRAINT fk_om_msg_item   FOREIGN KEY (item_id)         REFERENCES items(id)         ON DELETE SET NULL
) ENGINE=InnoDB;

-- Each organization's rules (Settings). NULL lists = the defaults in src/lib/constants.ts.
CREATE TABLE IF NOT EXISTS org_settings (
  organization_id INT UNSIGNED NOT NULL PRIMARY KEY,
  storage_days    SMALLINT UNSIGNED NOT NULL DEFAULT 90,  -- days an unclaimed found item is kept
  police_days     TINYINT UNSIGNED NOT NULL DEFAULT 7,    -- report to the police within this many days (Lost Property Act: 1 week)
  finder_keep_days TINYINT UNSIGNED NOT NULL DEFAULT 5,   -- a finder may keep a found item this long, then brings it to the office
  hide_sensitive  TINYINT(1) NOT NULL DEFAULT 0,          -- hide wallets, ID cards, IC cards and phones from Found items
  categories      TEXT NULL,                              -- JSON array
  shelves         TEXT NULL,                              -- JSON array
  id_types        TEXT NULL,                              -- JSON array
  updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_settings_org FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Which notifications each user has read (notifications themselves are built from the data).
CREATE TABLE IF NOT EXISTS notice_reads (
  user_id    INT UNSIGNED NOT NULL,
  notice_id  VARCHAR(64) NOT NULL,                     -- e.g. "ca12" = claim 12 approved
  read_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, notice_id),
  CONSTRAINT fk_reads_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Each user's choices (Notifications / Account → Privacy). No row = the defaults in src/lib/constants.ts.
CREATE TABLE IF NOT EXISTS user_prefs (
  user_id      INT UNSIGNED NOT NULL PRIMARY KEY,
  notify       TEXT NULL,                              -- JSON: {"claims":{"app":true,"email":true}, ...}
  share_email  TINYINT(1) NOT NULL DEFAULT 1,          -- staff may see my email address on claims and in Messages
  show_in_ranking TINYINT(1) NOT NULL DEFAULT 1,       -- show me in the "Top helpers" ranking
  alert_areas  TEXT NULL,                              -- JSON: buildings I watch for "Have you seen this?" alerts, e.g. ["A","B"]
  updated_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_prefs_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Thank-you points: recognition only. They cannot be bought or exchanged for money or goods. One row per person, reason, item.
CREATE TABLE IF NOT EXISTS points (
  id              INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  organization_id INT UNSIGNED NOT NULL,
  user_id         INT UNSIGNED NOT NULL,
  points          SMALLINT NOT NULL,
  reason          VARCHAR(20) NOT NULL,                  -- handed_in, on_time, returned, thanks, wrote_thanks
  item_id         INT UNSIGNED NOT NULL,
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_points_once (user_id, reason, item_id),
  INDEX idx_points_org (organization_id, user_id),
  CONSTRAINT fk_points_org  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  CONSTRAINT fk_points_user FOREIGN KEY (user_id)         REFERENCES users(id)         ON DELETE CASCADE
) ENGINE=InnoDB;

-- "Have you seen this?": a member says they may have seen someone's lost item (sent to the owner without names).
CREATE TABLE IF NOT EXISTS sightings (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  item_id    INT UNSIGNED NOT NULL,                  -- the lost report
  user_id    INT UNSIGNED NOT NULL,                  -- who saw it (never shown to the owner)
  note       VARCHAR(300) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_sight_item FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE,
  CONSTRAINT fk_sight_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Claps (👏) on the thank-you wall.
CREATE TABLE IF NOT EXISTS wall_claps (
  thanks_id  INT UNSIGNED NOT NULL,
  user_id    INT UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (thanks_id, user_id),
  CONSTRAINT fk_clap_thanks FOREIGN KEY (thanks_id) REFERENCES thanks(id) ON DELETE CASCADE,
  CONSTRAINT fk_clap_user   FOREIGN KEY (user_id)   REFERENCES users(id)  ON DELETE CASCADE
) ENGINE=InnoDB;

-- Upgrading an existing database (created before handed_in_at existed)? Run this once:
--   ALTER TABLE items ADD COLUMN handed_in_at TIMESTAMP NULL DEFAULT NULL AFTER received_at;
-- and (created before disposal records and pickup codes):
--   ALTER TABLE items ADD COLUMN disposed_at TIMESTAMP NULL DEFAULT NULL AFTER handed_in_at, ADD COLUMN disposal_method VARCHAR(50) NULL AFTER disposed_at,
--     ADD COLUMN disposal_note VARCHAR(255) NULL AFTER disposal_method, ADD COLUMN disposed_by INT UNSIGNED NULL AFTER disposal_note;
--   ALTER TABLE claims ADD COLUMN pickup_code CHAR(6) NULL AFTER answers;
-- and (created before map pins): run the places / thanks CREATE TABLE blocks above, then
--   ALTER TABLE items ADD COLUMN lat DECIMAL(9,6) NULL AFTER place, ADD COLUMN lng DECIMAL(9,6) NULL AFTER lat;
--   UPDATE items i JOIN places p ON p.organization_id = i.organization_id AND p.name = i.place SET i.lat = p.lat, i.lng = p.lng WHERE i.lat IS NULL;
-- and (approved claims from before pickup codes): give each one a code
--   UPDATE claims SET pickup_code = LPAD(FLOOR(RAND() * 1000000), 6, '0') WHERE status = 'approved' AND pickup_code IS NULL;
-- and (switching organization 1 to YSE):
--   UPDATE organizations SET name = 'Yokohama System Engineering College', description = '横浜システム工学院専門学校 · 〒241-0826 横浜市旭区東希望が丘128-4' WHERE id = 1;
--   DELETE FROM places WHERE organization_id = 1;  -- then run the INSERT IGNORE INTO places block above
-- and (created with the old claim_messages table): move claim questions into office chat, then drop it
--   INSERT INTO office_messages (organization_id, member_id, sender_id, from_staff, body, item_id, created_at, read_at)
--     SELECT i.organization_id, c.claimant_id, m.sender_id, m.from_staff, m.body, c.found_item_id, m.created_at, m.read_at
--     FROM claim_messages m JOIN claims c ON c.id = m.claim_id JOIN items i ON i.id = c.found_item_id ORDER BY m.id;
--   DROP TABLE claim_messages;
-- and (created before letter reactions):
--   ALTER TABLE thanks ADD COLUMN reaction VARCHAR(16) NULL AFTER read_at, ADD COLUMN reacted_at TIMESTAMP NULL DEFAULT NULL AFTER reaction;
-- and (created before saved settings): run the CREATE TABLE org_settings block above.
-- and (created before saved notifications): run the CREATE TABLE notice_reads and user_prefs blocks above.
-- and (created before "Delete my account"): ALTER TABLE users ADD COLUMN deleted_at DATETIME NULL AFTER password_hash;
-- and (created before Gemini matching): ALTER TABLE items ADD COLUMN ai_score TINYINT UNSIGNED NULL, ADD COLUMN ai_reason VARCHAR(300) NULL;
-- and (created before the super admin): ALTER TABLE users ADD COLUMN is_super TINYINT(1) NOT NULL DEFAULT 0 AFTER deleted_at;
--   then run the INSERT IGNORE INTO users ... 'super@example.com' line above.
-- and (created before the finder time limit): ALTER TABLE items ADD COLUMN keep_reminder TINYINT UNSIGNED NOT NULL DEFAULT 0;
--   ALTER TABLE org_settings ADD COLUMN finder_keep_days TINYINT UNSIGNED NOT NULL DEFAULT 5 AFTER police_days;
-- and (created before thank-you points): run the CREATE TABLE points block above, then
--   ALTER TABLE thanks ADD COLUMN points SMALLINT UNSIGNED NOT NULL DEFAULT 0;
--   ALTER TABLE user_prefs ADD COLUMN show_in_ranking TINYINT(1) NOT NULL DEFAULT 1;
-- and (created before alerts and the thank-you wall): run the CREATE TABLE sightings / wall_claps blocks above, then
--   ALTER TABLE items ADD COLUMN ask_help TINYINT(1) NOT NULL DEFAULT 0;
--   ALTER TABLE user_prefs ADD COLUMN alert_areas TEXT NULL;
--   ALTER TABLE thanks ADD COLUMN on_wall TINYINT(1) NOT NULL DEFAULT 0;

import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import path from "node:path";

const databasePath = process.env.DATABASE_PATH || path.join(process.cwd(), ".data", "easyqr.db");
mkdirSync(path.dirname(databasePath), { recursive: true });

export const db = new Database(databasePath);

db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");
db.pragma("busy_timeout = 5000");

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE COLLATE NOCASE,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    token_hash TEXT NOT NULL UNIQUE,
    expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS sessions_token_hash_idx ON sessions(token_hash);
  CREATE INDEX IF NOT EXISTS sessions_expires_at_idx ON sessions(expires_at);

  CREATE TABLE IF NOT EXISTS ai_credit_wallets (
    user_id TEXT PRIMARY KEY,
    balance INTEGER NOT NULL DEFAULT 0 CHECK (balance >= 0),
    lifetime_granted INTEGER NOT NULL DEFAULT 0 CHECK (lifetime_granted >= 0),
    lifetime_spent INTEGER NOT NULL DEFAULT 0 CHECK (lifetime_spent >= 0),
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS ai_credit_transactions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    kind TEXT NOT NULL CHECK (kind IN ('grant', 'spend', 'refund')),
    amount INTEGER NOT NULL CHECK (amount <> 0),
    balance_after INTEGER NOT NULL CHECK (balance_after >= 0),
    operation TEXT,
    reference_id TEXT,
    description TEXT NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE UNIQUE INDEX IF NOT EXISTS ai_credit_transactions_user_reference_idx
    ON ai_credit_transactions(user_id, reference_id)
    WHERE reference_id IS NOT NULL;
  CREATE INDEX IF NOT EXISTS ai_credit_transactions_user_created_idx
    ON ai_credit_transactions(user_id, created_at DESC);

  CREATE TABLE IF NOT EXISTS menus (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
    content_json TEXT NOT NULL,
    theme_json TEXT NOT NULL,
    published_content_json TEXT,
    published_theme_json TEXT,
    view_count INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    published_at TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS menus_user_updated_idx ON menus(user_id, updated_at DESC);
  CREATE INDEX IF NOT EXISTS menus_slug_idx ON menus(slug);

  CREATE TABLE IF NOT EXISTS menu_views (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    menu_id TEXT NOT NULL,
    visit_id TEXT UNIQUE,
    visitor_hash TEXT,
    viewed_at TEXT NOT NULL,
    source TEXT NOT NULL DEFAULT 'unknown',
    device_type TEXT NOT NULL DEFAULT 'unknown',
    language TEXT NOT NULL DEFAULT 'unknown',
    FOREIGN KEY (menu_id) REFERENCES menus(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS menu_views_menu_viewed_idx ON menu_views(menu_id, viewed_at DESC);
  CREATE INDEX IF NOT EXISTS menu_views_viewed_idx ON menu_views(viewed_at DESC);

  CREATE TABLE IF NOT EXISTS ai_cache (
    cache_key TEXT PRIMARY KEY,
    operation TEXT NOT NULL,
    payload_json TEXT NOT NULL,
    payload_bytes INTEGER NOT NULL,
    hit_count INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    last_accessed_at TEXT NOT NULL,
    expires_at TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS ai_cache_operation_accessed_idx
    ON ai_cache(operation, last_accessed_at DESC);
  CREATE INDEX IF NOT EXISTS ai_cache_expires_idx ON ai_cache(expires_at);
`);

type DatabaseColumn = { name: string };
const menuViewColumns = new Set(
  (db.prepare("PRAGMA table_info(menu_views)").all() as DatabaseColumn[])
    .map((column) => column.name),
);

if (!menuViewColumns.has("source")) {
  db.exec("ALTER TABLE menu_views ADD COLUMN source TEXT NOT NULL DEFAULT 'unknown'");
}
if (!menuViewColumns.has("device_type")) {
  db.exec("ALTER TABLE menu_views ADD COLUMN device_type TEXT NOT NULL DEFAULT 'unknown'");
}
if (!menuViewColumns.has("language")) {
  db.exec("ALTER TABLE menu_views ADD COLUMN language TEXT NOT NULL DEFAULT 'unknown'");
}
if (!menuViewColumns.has("visit_id")) {
  db.exec("ALTER TABLE menu_views ADD COLUMN visit_id TEXT");
}
if (!menuViewColumns.has("visitor_hash")) {
  db.exec("ALTER TABLE menu_views ADD COLUMN visitor_hash TEXT");
}

// Historical views receive opaque IDs so the same indexes and joins work for
// both migrated databases and fresh installations.
db.exec(`
  UPDATE menu_views
  SET visit_id = lower(hex(randomblob(16)))
  WHERE visit_id IS NULL;

  CREATE UNIQUE INDEX IF NOT EXISTS menu_views_visit_id_idx ON menu_views(visit_id);
  CREATE INDEX IF NOT EXISTS menu_views_visitor_hash_idx
    ON menu_views(visitor_hash, viewed_at DESC)
    WHERE visitor_hash IS NOT NULL;

  CREATE TABLE IF NOT EXISTS menu_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    menu_id TEXT NOT NULL,
    visit_id TEXT NOT NULL,
    event_type TEXT NOT NULL,
    category_id TEXT,
    item_id TEXT,
    event_value TEXT,
    result_count INTEGER,
    dedupe_key TEXT,
    occurred_at TEXT NOT NULL,
    FOREIGN KEY (menu_id) REFERENCES menus(id) ON DELETE CASCADE,
    FOREIGN KEY (visit_id) REFERENCES menu_views(visit_id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS menu_events_menu_occurred_idx
    ON menu_events(menu_id, occurred_at DESC);
  CREATE INDEX IF NOT EXISTS menu_events_menu_type_occurred_idx
    ON menu_events(menu_id, event_type, occurred_at DESC);
  CREATE INDEX IF NOT EXISTS menu_events_item_occurred_idx
    ON menu_events(menu_id, item_id, occurred_at DESC)
    WHERE item_id IS NOT NULL;
  CREATE INDEX IF NOT EXISTS menu_events_category_occurred_idx
    ON menu_events(menu_id, category_id, occurred_at DESC)
    WHERE category_id IS NOT NULL;
  CREATE UNIQUE INDEX IF NOT EXISTS menu_events_visit_dedupe_idx
    ON menu_events(visit_id, dedupe_key)
    WHERE dedupe_key IS NOT NULL;
`);

const menuColumns = new Set(
  (db.prepare("PRAGMA table_info(menus)").all() as DatabaseColumn[])
    .map((column) => column.name),
);

if (!menuColumns.has("published_content_json")) {
  db.exec("ALTER TABLE menus ADD COLUMN published_content_json TEXT");
}
if (!menuColumns.has("published_theme_json")) {
  db.exec("ALTER TABLE menus ADD COLUMN published_theme_json TEXT");
}

// Existing live menus become their own initial published snapshot. From this
// point on content_json/theme_json are the editable working copy.
db.exec(`
  UPDATE menus
  SET published_content_json = content_json,
      published_theme_json = theme_json
  WHERE status = 'published'
    AND (published_content_json IS NULL OR published_theme_json IS NULL)
`);

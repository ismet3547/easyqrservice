// Account lifecycle integration tests use an isolated SQLite database.
"use strict";

const assert = require("node:assert/strict");
const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const Module = require("node:module");
const ts = require("typescript");
const LegacyDatabase = require("better-sqlite3");

const root = path.resolve(__dirname, "..");
const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), "easyqr-account-test-"));
process.env.DATABASE_PATH = path.join(temporaryRoot, "account.db");

// Seed the two tables changed by this phase in their pre-migration shape. The
// real module must upgrade this database without trying to index a missing
// column or retaining a cache row that belonged to an unknown account.
const legacyDatabase = new LegacyDatabase(process.env.DATABASE_PATH);
legacyDatabase.exec(`
  CREATE TABLE users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE COLLATE NOCASE,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
  INSERT INTO users VALUES (
    'legacy', 'Legacy User', 'legacy@example.test', 'legacy-hash',
    '2026-09-01T00:00:00.000Z', '2026-09-01T00:00:00.000Z'
  );
  CREATE TABLE ai_cache (
    cache_key TEXT PRIMARY KEY,
    operation TEXT NOT NULL,
    payload_json TEXT NOT NULL,
    payload_bytes INTEGER NOT NULL,
    hit_count INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    last_accessed_at TEXT NOT NULL,
    expires_at TEXT NOT NULL
  );
  INSERT INTO ai_cache VALUES (
    'legacy-cache', 'extract-menu', '{}', 2, 0,
    '2026-09-01T00:00:00.000Z', '2026-09-01T00:00:00.000Z', '2099-01-01T00:00:00.000Z'
  );
`);
legacyDatabase.close();

const originalResolve = Module._resolveFilename;
Module._resolveFilename = function (request, ...args) {
  return originalResolve.call(
    this,
    request.startsWith("@/") ? path.join(root, request.slice(2)) : request,
    ...args,
  );
};
require.extensions[".ts"] = (module, filename) => module._compile(
  ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    compilerOptions: {
      esModuleInterop: true,
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText,
  filename,
);

const { db } = require("../lib/db.ts");
const {
  getAccountAccess,
  getAccountFeatureBlock,
  planMenuLimits,
} = require("../lib/account-plan.ts");
const {
  createPasswordResetToken,
  resetPasswordWithToken,
} = require("../lib/password-reset.ts");
const {
  createAiCacheKey,
  readAiCache,
  writeAiCache,
} = require("../lib/ai-cache.ts");
const { deleteUserAccount } = require("../lib/account.ts");
const { createPasswordResetUrl } = require("../lib/email.ts");

const now = new Date("2026-09-07T12:00:00.000Z");
const isoAfterDays = (days) => new Date(now.getTime() + days * 86400000).toISOString();
const insertUser = db.prepare(`INSERT INTO users
  (id, name, email, password_hash, plan, trial_ends_at, plan_expires_at, created_at, updated_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);
const insertMenu = db.prepare(`INSERT INTO menus
  (id, user_id, name, slug, status, content_json, theme_json, published_content_json,
   published_theme_json, created_at, updated_at, published_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);

function addUser(id, { plan = "trial", trialEndsAt = isoAfterDays(7), planExpiresAt = null } = {}) {
  insertUser.run(
    id,
    `Test ${id}`,
    `${id}@example.test`,
    "old-password-hash",
    plan,
    trialEndsAt,
    planExpiresAt,
    isoAfterDays(-1),
    now.toISOString(),
  );
}

function addMenu(id, userId, status = "draft") {
  const menu = JSON.stringify({ restaurantName: id, subtitle: "", currency: "₺", categories: [] });
  const theme = JSON.stringify({
    accent: "#e85b2a",
    background: "#ffffff",
    font: "modern",
    layout: "cards",
    showDescriptions: true,
    surface: "#ffffff",
    text: "#222222",
  });
  insertMenu.run(
    id,
    userId,
    id,
    `slug-${id}`,
    status,
    menu,
    theme,
    status === "published" ? menu : null,
    status === "published" ? theme : null,
    now.toISOString(),
    now.toISOString(),
    status === "published" ? now.toISOString() : null,
  );
}

function cacheValue(userId, label) {
  const cacheKey = createAiCacheKey({
    userId,
    operation: "test-operation",
    version: "v1",
    model: "test-model",
    input: "same-input",
  });
  assert.equal(writeAiCache({
    userId,
    cacheKey,
    operation: "test-operation",
    value: { label },
    ttlMs: 60000,
    maxEntries: 10,
    maxOperationBytes: 10000,
    maxPayloadBytes: 1000,
  }), true);
  return cacheKey;
}

try {
  process.env.APP_URL = "https://menu.example.test";
  const resetUrl = new URL(createPasswordResetUrl("A".repeat(43)));
  assert.equal(resetUrl.origin, "https://menu.example.test");
  assert.equal(resetUrl.pathname, "/sifre-sifirla");
  assert.equal(resetUrl.search, "", "reset token must not be sent in the HTTP query");
  assert.equal(resetUrl.hash, `#token=${"A".repeat(43)}`);

  const legacyUser = db.prepare(
    `SELECT plan, trial_ends_at, plan_expires_at, terms_accepted_at, terms_version
     FROM users WHERE id = 'legacy'`,
  ).get();
  assert.equal(legacyUser.terms_accepted_at, null);
  assert.equal(legacyUser.terms_version, null);
  assert.equal(legacyUser.plan, "trial");
  assert.ok(legacyUser.trial_ends_at, "existing accounts receive a migration grace period");
  assert.equal(legacyUser.plan_expires_at, null);
  assert.equal(db.prepare("SELECT COUNT(*) AS count FROM ai_cache").get().count, 0);

  addUser("trial-active");
  let access = getAccountAccess("trial-active", now);
  assert.equal(access.status, "active");
  assert.equal(access.daysRemaining, 7);
  assert.equal(access.maxMenus, planMenuLimits.trial);
  assert.equal(access.canCreateMenu, true);
  assert.equal(getAccountFeatureBlock(access, "ai"), null);

  addMenu("trial-menu", "trial-active");
  access = getAccountAccess("trial-active", now);
  assert.equal(access.canCreateMenu, false);
  assert.equal(getAccountFeatureBlock(access, "create-menu").code, "MENU_LIMIT_REACHED");
  assert.equal(access.canPublish, true);

  addUser("trial-expired", { trialEndsAt: isoAfterDays(-1) });
  addMenu("expired-live", "trial-expired", "published");
  const expired = getAccountAccess("trial-expired", now);
  assert.equal(expired.status, "expired");
  assert.equal(expired.canUseAi, false);
  assert.equal(getAccountFeatureBlock(expired, "publish").code, "ACCOUNT_ACCESS_EXPIRED");
  assert.equal(
    db.prepare("SELECT status FROM menus WHERE id = ?").get("expired-live").status,
    "published",
    "trial expiry must not take an existing public menu offline",
  );

  addUser("pro-active", { plan: "pro", planExpiresAt: isoAfterDays(30) });
  const pro = getAccountAccess("pro-active", now);
  assert.equal(pro.status, "active");
  assert.equal(pro.maxMenus, planMenuLimits.pro);
  assert.equal(pro.canUseAi, true);

  addUser("pilot-customer");
  const activation = spawnSync(
    process.execPath,
    [
      path.join(root, "scripts", "activate-account.cjs"),
      "--email",
      "pilot-customer@example.test",
      "--days",
      "30",
    ],
    {
      encoding: "utf8",
      env: { ...process.env, DATABASE_PATH: process.env.DATABASE_PATH },
    },
  );
  assert.equal(activation.status, 0, activation.stderr || activation.stdout);
  const activatedPlan = db.prepare(
    "SELECT plan, plan_expires_at FROM users WHERE id = ?",
  ).get("pilot-customer");
  assert.equal(activatedPlan.plan, "pro");
  assert.ok(Date.parse(activatedPlan.plan_expires_at) > Date.now());

  addUser("reset-user");
  db.prepare(
    "INSERT INTO sessions (id, user_id, token_hash, expires_at, created_at) VALUES (?, ?, ?, ?, ?)",
  ).run("reset-session", "reset-user", "session-hash", isoAfterDays(1), now.toISOString());
  const reset = createPasswordResetToken("reset-user", now);
  const storedToken = db.prepare(
    "SELECT token_hash FROM password_reset_tokens WHERE user_id = ?",
  ).get("reset-user");
  assert.notEqual(storedToken.token_hash, reset.token);
  assert.equal(JSON.stringify(storedToken).includes(reset.token), false, "raw reset token must never persist");
  assert.equal(
    resetPasswordWithToken(reset.token, "new-password-hash", new Date(now.getTime() + 60000)),
    true,
  );
  assert.equal(
    db.prepare("SELECT password_hash FROM users WHERE id = ?").get("reset-user").password_hash,
    "new-password-hash",
  );
  assert.equal(db.prepare("SELECT COUNT(*) AS count FROM sessions WHERE user_id = ?").get("reset-user").count, 0);
  assert.equal(db.prepare("SELECT COUNT(*) AS count FROM password_reset_tokens WHERE user_id = ?").get("reset-user").count, 0);
  assert.equal(resetPasswordWithToken(reset.token, "another-hash", now), false, "token must be single-use");

  const expiredReset = createPasswordResetToken(
    "reset-user",
    new Date(now.getTime() - 31 * 60 * 1000),
  );
  assert.equal(resetPasswordWithToken(expiredReset.token, "another-hash", now), false);

  addUser("cache-a");
  addUser("cache-b");
  const cacheA = cacheValue("cache-a", "A");
  const cacheB = cacheValue("cache-b", "B");
  assert.notEqual(cacheA, cacheB);
  assert.deepEqual(readAiCache("cache-a", cacheA, "test-operation"), { label: "A" });
  assert.deepEqual(readAiCache("cache-b", cacheB, "test-operation"), { label: "B" });
  assert.equal(readAiCache("cache-b", cacheA, "test-operation"), null, "cache cannot cross accounts");

  addMenu("delete-menu", "cache-a", "published");
  db.prepare(
    "INSERT INTO menu_views (menu_id, visit_id, viewed_at) VALUES (?, ?, ?)",
  ).run("delete-menu", "delete-visit", now.toISOString());
  db.prepare(
    "INSERT INTO menu_events (menu_id, visit_id, event_type, occurred_at) VALUES (?, ?, ?, ?)",
  ).run("delete-menu", "delete-visit", "product_view", now.toISOString());
  db.prepare(
    "INSERT INTO sessions (id, user_id, token_hash, expires_at, created_at) VALUES (?, ?, ?, ?, ?)",
  ).run("delete-session", "cache-a", "delete-session-hash", isoAfterDays(1), now.toISOString());
  db.prepare(
    `INSERT INTO ai_credit_wallets
      (user_id, balance, lifetime_granted, lifetime_spent, created_at, updated_at)
     VALUES (?, 20, 20, 0, ?, ?)`,
  ).run("cache-a", now.toISOString(), now.toISOString());
  db.prepare(
    `INSERT INTO ai_credit_transactions
      (id, user_id, kind, amount, balance_after, description, created_at)
     VALUES (?, ?, 'grant', 20, 20, 'test', ?)`,
  ).run("delete-credit", "cache-a", now.toISOString());
  createPasswordResetToken("cache-a", now);

  assert.equal(deleteUserAccount("cache-a"), true);
  assert.equal(db.prepare("SELECT COUNT(*) AS count FROM users WHERE id = ?").get("cache-a").count, 0);
  assert.equal(db.prepare("SELECT COUNT(*) AS count FROM menus WHERE user_id = ?").get("cache-a").count, 0);
  assert.equal(db.prepare("SELECT COUNT(*) AS count FROM menu_views WHERE menu_id = ?").get("delete-menu").count, 0);
  assert.equal(db.prepare("SELECT COUNT(*) AS count FROM menu_events WHERE menu_id = ?").get("delete-menu").count, 0);
  assert.equal(db.prepare("SELECT COUNT(*) AS count FROM sessions WHERE user_id = ?").get("cache-a").count, 0);
  assert.equal(db.prepare("SELECT COUNT(*) AS count FROM password_reset_tokens WHERE user_id = ?").get("cache-a").count, 0);
  assert.equal(db.prepare("SELECT COUNT(*) AS count FROM ai_credit_wallets WHERE user_id = ?").get("cache-a").count, 0);
  assert.equal(db.prepare("SELECT COUNT(*) AS count FROM ai_credit_transactions WHERE user_id = ?").get("cache-a").count, 0);
  assert.equal(db.prepare("SELECT COUNT(*) AS count FROM ai_cache WHERE user_id = ?").get("cache-a").count, 0);
  assert.deepEqual(readAiCache("cache-b", cacheB, "test-operation"), { label: "B" });
  assert.equal(deleteUserAccount("cache-a"), false);

  console.log(
    "Account lifecycle passed: migration, trial/Pro access, manual activation, menu limits, hashed single-use reset, session invalidation, cache isolation and cascading account deletion.",
  );
} finally {
  db.close();
  fs.rmSync(temporaryRoot, { recursive: true, force: true });
}

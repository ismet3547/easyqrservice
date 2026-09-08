"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const Database = require("better-sqlite3");
const { createDatabaseBackup } = require("./backup-database.cjs");
const { verifyDatabaseFile } = require("./database-backup-utils.cjs");
const { restoreDatabase } = require("./restore-database.cjs");
const { validateProductionEnv } = require("./production-env.cjs");

const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), "easyqr-ops-test-"));
const sourcePath = path.join(temporaryRoot, "live", "easyqr.db");
const backupDirectory = path.join(temporaryRoot, "backups");
const validationRoot = path.join(path.parse(process.cwd()).root, "easyqr-validation-data");

async function run() {
  const valid = validateProductionEnv({
    NODE_ENV: "production",
    APP_URL: "https://menu.example.test",
    DATABASE_PATH: path.join(validationRoot, "easyqr.db"),
    OPENAI_API_KEY: "test-only",
    EMAIL_DELIVERY_MODE: "resend",
    RESEND_API_KEY: "test-only",
    EMAIL_FROM: "easyqr <no-reply@example.test>",
    BACKUP_DIR: path.join(validationRoot, "backups"),
  }, { cwd: path.join(path.parse(process.cwd()).root, "easyqr-app") });
  assert.deepEqual(valid.errors, []);
  assert.equal(valid.config.backupRetentionDays, 14);
  assert.equal(valid.config.backupMaxFiles, 30);

  const demo = validateProductionEnv({
    APP_URL: "http://localhost:3000",
    DATABASE_PATH: path.join(validationRoot, "easyqr.db"),
    ALLOW_DEMO_MODE: "true",
    EMAIL_DELIVERY_MODE: "log",
  }, { cwd: path.join(path.parse(process.cwd()).root, "easyqr-app") });
  assert.deepEqual(demo.errors, []);

  const invalid = validateProductionEnv({
    APP_URL: "http://public.example.test/path",
    DATABASE_PATH: "relative.db",
    NEXT_PUBLIC_OPENAI_API_KEY: "must-not-leak",
    NEXT_PUBLIC_RESEND_API_KEY: "must-not-leak",
  });
  assert.ok(invalid.errors.some((error) => error.includes("HTTPS")));
  assert.ok(invalid.errors.some((error) => error.includes("yalnızca origin")));
  assert.ok(invalid.errors.some((error) => error.includes("mutlak")));
  assert.ok(invalid.errors.some((error) => error.includes("NEXT_PUBLIC_OPENAI_API_KEY")));
  assert.ok(invalid.errors.some((error) => error.includes("NEXT_PUBLIC_RESEND_API_KEY")));
  assert.ok(invalid.errors.some((error) => error.includes("OPENAI_API_KEY zorunludur")));
  assert.ok(invalid.errors.some((error) => error.includes("RESEND_API_KEY")));
  assert.ok(invalid.errors.some((error) => error.includes("EMAIL_FROM")));

  fs.mkdirSync(path.dirname(sourcePath), { recursive: true });
  const liveDatabase = new Database(sourcePath);
  liveDatabase.pragma("journal_mode = WAL");
  liveDatabase.exec("CREATE TABLE orders (id INTEGER PRIMARY KEY, label TEXT NOT NULL)");
  liveDatabase.prepare("INSERT INTO orders (label) VALUES (?)").run("pilot-customer");

  try {
    const backupTimes = [
      new Date("2026-09-01T00:00:00.000Z"),
      new Date("2026-09-02T00:00:00.000Z"),
      new Date("2026-09-03T00:00:00.000Z"),
    ];
    const backups = [];
    for (const now of backupTimes) {
      backups.push(await createDatabaseBackup({
        databasePath: sourcePath,
        backupDirectory,
        retentionDays: 365,
        maximumFiles: 2,
        now,
      }));
    }

    const retained = fs.readdirSync(backupDirectory)
      .filter((name) => name.endsWith(".sqlite3"))
      .sort();
    assert.equal(retained.length, 2, "retention must cap backup files");
    assert.ok(backups[2].removed.length === 1, "oldest backup should be pruned");

    const latest = backups[2].filePath;
    const verified = verifyDatabaseFile(latest);
    assert.ok(verified.bytes > 0);
    assert.ok(verified.tableCount >= 1);

    const restoredPath = path.join(temporaryRoot, "restored", "easyqr.db");
    const restored = restoreDatabase({ sourcePath: latest, targetPath: restoredPath });
    assert.equal(restored.restored.checksum, verified.checksum);
    const restoredDatabase = new Database(restoredPath, { readonly: true });
    try {
      const row = restoredDatabase.prepare("SELECT label FROM orders WHERE id = 1").get();
      assert.equal(row.label, "pilot-customer", "live WAL data must be present in backup");
    } finally {
      restoredDatabase.close();
    }

    assert.throws(
      () => restoreDatabase({ sourcePath: latest, targetPath: restoredPath }),
      /zaten var/,
      "restore must never overwrite an existing database",
    );

    const checksumPath = `${latest}.sha256`;
    const originalChecksum = fs.readFileSync(checksumPath, "utf8");
    fs.writeFileSync(checksumPath, `${"0".repeat(64)}  ${path.basename(latest)}\n`);
    assert.throws(() => verifyDatabaseFile(latest), /checksum/);
    fs.writeFileSync(checksumPath, originalChecksum);
  } finally {
    liveDatabase.close();
  }

  console.log(
    "Production operations passed: env validation, live SQLite backup, retention, checksum, integrity, safe restore and overwrite refusal.",
  );
}

run()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => {
    fs.rmSync(temporaryRoot, { recursive: true, force: true });
  });

"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const Database = require("better-sqlite3");
const { createDatabaseBackup } = require("./backup-database.cjs");
const { checkBackupHealth } = require("./check-backup-health.cjs");
const { verifyDatabaseFile } = require("./database-backup-utils.cjs");
const { restoreDatabase } = require("./restore-database.cjs");
const { validateProductionEnv } = require("./production-env.cjs");
const { runProductionSmoke } = require("./smoke-production.cjs");

const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), "easyqr-ops-test-"));
const sourcePath = path.join(temporaryRoot, "live", "easyqr.db");
const backupDirectory = path.join(temporaryRoot, "backups");
const validationRoot = path.join(path.parse(process.cwd()).root, "easyqr-validation-data");

async function run() {
  const valid = validateProductionEnv({
    NODE_ENV: "production",
    APP_URL: "https://menu.example.test",
    LOCAL_PREVIEW_ORIGINS: "http://localhost:3001,http://127.0.0.1:3002",
    CLIENT_IP_HEADER: "x-real-ip",
    DATABASE_PATH: path.join(validationRoot, "easyqr.db"),
    OPENAI_API_KEY: "test-only",
    EMAIL_DELIVERY_MODE: "resend",
    RESEND_API_KEY: "test-only",
    EMAIL_FROM: "easyqr <no-reply@example.test>",
    LEGAL_ENTITY_NAME: "Example Menu Ltd.",
    LEGAL_CONTACT_EMAIL: "privacy@example.test",
    LEGAL_ADDRESS: "Example Mahallesi No: 1 İstanbul",
    BACKUP_DIR: path.join(validationRoot, "backups"),
  }, { cwd: path.join(path.parse(process.cwd()).root, "easyqr-app") });
  assert.deepEqual(valid.errors, []);
  assert.equal(valid.config.backupRetentionDays, 14);
  assert.equal(valid.config.backupMaxFiles, 30);
  assert.deepEqual(valid.config.localPreviewOrigins, [
    "http://localhost:3001",
    "http://127.0.0.1:3002",
  ]);

  const demo = validateProductionEnv({
    APP_URL: "http://localhost:3000",
    DATABASE_PATH: path.join(validationRoot, "easyqr.db"),
    ALLOW_DEMO_MODE: "true",
    EMAIL_DELIVERY_MODE: "log",
    LEGAL_ENTITY_NAME: "Example Menu Ltd.",
    LEGAL_CONTACT_EMAIL: "privacy@example.test",
    LEGAL_ADDRESS: "Example Mahallesi No: 1 İstanbul",
  }, { cwd: path.join(path.parse(process.cwd()).root, "easyqr-app") });
  assert.deepEqual(demo.errors, []);

  const invalid = validateProductionEnv({
    APP_URL: "http://public.example.test/path",
    LOCAL_PREVIEW_ORIGINS: "https://evil.example.test/path",
    DATABASE_PATH: "relative.db",
    NEXT_PUBLIC_OPENAI_API_KEY: "must-not-leak",
    NEXT_PUBLIC_RESEND_API_KEY: "must-not-leak",
  });
  assert.ok(invalid.errors.some((error) => error.includes("HTTPS")));
  assert.ok(invalid.errors.some((error) => error.includes("yalnızca origin")));
  assert.ok(invalid.errors.some((error) => error.includes("LOCAL_PREVIEW_ORIGINS")));
  assert.ok(invalid.errors.some((error) => error.includes("mutlak")));
  assert.ok(invalid.errors.some((error) => error.includes("NEXT_PUBLIC_OPENAI_API_KEY")));
  assert.ok(invalid.errors.some((error) => error.includes("NEXT_PUBLIC_RESEND_API_KEY")));
  assert.ok(invalid.errors.some((error) => error.includes("OPENAI_API_KEY zorunludur")));
  assert.ok(invalid.errors.some((error) => error.includes("RESEND_API_KEY")));
  assert.ok(invalid.errors.some((error) => error.includes("EMAIL_FROM")));
  assert.ok(invalid.errors.some((error) => error.includes("LEGAL_ENTITY_NAME")));
  assert.ok(invalid.errors.some((error) => error.includes("LEGAL_CONTACT_EMAIL")));
  assert.ok(invalid.errors.some((error) => error.includes("LEGAL_ADDRESS")));
  assert.ok(invalid.errors.some((error) => error.includes("CLIENT_IP_HEADER")));

  const smokeOrigin = "https://menu.example.test";
  const securityHeaders = {
    "content-security-policy": "default-src 'self'",
    "strict-transport-security": "max-age=31536000; includeSubDomains",
    "referrer-policy": "strict-origin-when-cross-origin",
    "x-content-type-options": "nosniff",
    "x-frame-options": "SAMEORIGIN",
  };
  const smokeFetch = async (url) => {
    const pathname = new URL(url).pathname;
    if (pathname === "/api/health") {
      return Response.json({ status: "ok" }, {
        headers: { "Cache-Control": "no-store" },
      });
    }
    if (pathname === "/robots.txt") {
      return new Response(`User-Agent: *\nAllow: /\nSitemap: ${smokeOrigin}/sitemap.xml\n`);
    }
    if (pathname === "/sitemap.xml") {
      return new Response(`<urlset><url><loc>${smokeOrigin}</loc></url></urlset>`);
    }
    return new Response("<!doctype html><html><body>EasyQR</body></html>", {
      headers: { ...securityHeaders, "Content-Type": "text/html; charset=utf-8" },
    });
  };
  const smokeResult = await runProductionSmoke({
    baseUrl: smokeOrigin,
    fetchImplementation: smokeFetch,
  });
  assert.equal(smokeResult.status, "ok");
  assert.equal(smokeResult.checks.length, 7);
  await assert.rejects(
    () => runProductionSmoke({
      baseUrl: smokeOrigin,
      fetchImplementation: async (url) => {
        const response = await smokeFetch(url);
        if (new URL(url).pathname !== "/") return response;
        const headers = new Headers(response.headers);
        headers.delete("strict-transport-security");
        return new Response(await response.text(), { headers });
      },
    }),
    /strict-transport-security/,
  );

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
    const backupHealth = checkBackupHealth({
      backupDirectory,
      intervalHours: 24,
      now: new Date("2026-09-03T00:10:00.000Z"),
    });
    assert.equal(backupHealth.backup, latest);
    assert.throws(
      () => checkBackupHealth({
        backupDirectory,
        intervalHours: 24,
        now: new Date("2026-09-04T02:00:00.000Z"),
      }),
      /gecikmiş/,
    );

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
    "Production operations passed: env validation, deploy smoke gate, backup health, live SQLite backup, retention, checksum, integrity, safe restore and overwrite refusal.",
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

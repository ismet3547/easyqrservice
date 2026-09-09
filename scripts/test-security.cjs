// Security regression tests use an isolated SQLite database.
"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const Module = require("node:module");
const ts = require("typescript");

const root = path.resolve(__dirname, "..");
const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), "easyqr-security-test-"));
process.env.DATABASE_PATH = path.join(temporaryRoot, "security.db");
process.env.NODE_ENV = "production";

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

const { readJsonRequest } = require("../lib/http.ts");
const { getSafeInternalPath } = require("../lib/navigation.ts");
const {
  isSupportedUploadMimeType,
  isValidUploadedDataUrl,
} = require("../lib/upload.ts");
const { checkRateLimit } = require("../lib/rate-limit.ts");
const { db } = require("../lib/db.ts");
const { isValidMenuData } = require("../lib/menus.ts");
const nextConfig = require("../next.config.ts").default;

function dataUrl(mimeType, bytes) {
  return `data:${mimeType};base64,${Buffer.from(bytes).toString("base64")}`;
}

async function testJsonReader() {
  const valid = await readJsonRequest(new Request("https://easyqr.example/api/test", {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({ ok: true }),
  }), 64);
  assert.deepEqual(valid, { ok: true, value: { ok: true } });

  const wrongType = await readJsonRequest(new Request("https://easyqr.example/api/test", {
    method: "POST",
    headers: { "Content-Type": "text/plain" },
    body: "{}",
  }), 64);
  assert.equal(wrongType.ok, false);
  assert.equal(wrongType.status, 415);

  const encoded = await readJsonRequest(new Request("https://easyqr.example/api/test", {
    method: "POST",
    headers: {
      "Content-Encoding": "gzip",
      "Content-Type": "application/json",
    },
    body: "{}",
  }), 64);
  assert.equal(encoded.ok, false);
  assert.equal(encoded.status, 415);

  const oversized = await readJsonRequest(new Request("https://easyqr.example/api/test", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ value: "x".repeat(80) }),
  }), 32);
  assert.equal(oversized.ok, false);
  assert.equal(oversized.status, 413);
}

function testInternalNavigation() {
  assert.equal(
    getSafeInternalPath("/dashboard?welcome=1#start", "/dashboard"),
    "/dashboard?welcome=1#start",
  );
  for (const unsafe of [
    "https://evil.example",
    "//evil.example",
    "/\\evil.example",
    "/%5c%5cevil.example",
    "/%255c%255cevil.example",
    "/%2f%2fevil.example",
  ]) {
    assert.equal(getSafeInternalPath(unsafe, "/dashboard"), "/dashboard", unsafe);
  }
}

function testUploads() {
  const fixtures = [
    ["image/jpeg", [0xff, 0xd8, 0xff, 0xdb]],
    ["image/png", [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]],
    ["image/webp", Buffer.from("RIFF0000WEBP", "ascii")],
    ["application/pdf", Buffer.from("%PDF-1.7", "ascii")],
  ];

  for (const [mimeType, bytes] of fixtures) {
    assert.equal(isSupportedUploadMimeType(mimeType), true);
    assert.equal(isValidUploadedDataUrl(dataUrl(mimeType, bytes), mimeType, 64), true);
  }
  assert.equal(isSupportedUploadMimeType("image/svg+xml"), false);
  assert.equal(
    isValidUploadedDataUrl(dataUrl("image/png", [0xff, 0xd8, 0xff]), "image/png", 64),
    false,
  );
  assert.equal(
    isValidUploadedDataUrl("https://example.test/menu.png", "image/png", 64),
    false,
  );
  assert.equal(
    isValidUploadedDataUrl("data:image/png;base64,%%%%", "image/png", 64),
    false,
  );
}

function testRateLimitPersistence() {
  const key = "security-test:secret@example.test";
  assert.equal(checkRateLimit(key, 2, 60_000).allowed, true);
  assert.equal(checkRateLimit(key, 2, 60_000).allowed, true);
  const blocked = checkRateLimit(key, 2, 60_000);
  assert.equal(blocked.allowed, false);
  assert.ok(blocked.retryAfterSeconds > 0);

  const row = db.prepare("SELECT key_hash, attempts FROM rate_limits").get();
  assert.match(row.key_hash, /^[a-f0-9]{64}$/);
  assert.equal(row.key_hash.includes("secret"), false);
  assert.equal(row.attempts, 3);

  db.prepare("UPDATE rate_limits SET reset_at = 0").run();
  assert.equal(checkRateLimit(key, 2, 60_000).allowed, true);
}

function testMenuSchema() {
  const valid = {
    restaurantName: "Test",
    subtitle: "",
    currency: "₺",
    categories: [
      {
        id: "food",
        name: "Yemek",
        items: [
          {
            id: "soup",
            name: "Çorba",
            description: "",
            price: "100",
            badge: "",
          },
        ],
      },
    ],
  };
  assert.equal(isValidMenuData(valid), true);
  assert.equal(isValidMenuData({ ...valid, unexpected: true }), false);
  assert.equal(isValidMenuData({
    ...valid,
    categories: [
      valid.categories[0],
      { id: "other", name: "Diğer", items: [{ ...valid.categories[0].items[0] }] },
    ],
  }), false);
}

async function testSecurityHeaders() {
  assert.equal(nextConfig.poweredByHeader, false);
  const definitions = await nextConfig.headers();
  const headers = Object.fromEntries(
    definitions.flatMap((definition) =>
      definition.headers.map((header) => [header.key, header.value]),
    ),
  );
  assert.equal(headers["X-Content-Type-Options"], "nosniff");
  assert.equal(headers["X-Frame-Options"], "SAMEORIGIN");
  assert.match(headers["Content-Security-Policy"], /object-src 'none'/);
  assert.match(headers["Content-Security-Policy"], /frame-ancestors 'self'/);
  assert.equal(
    headers["Strict-Transport-Security"],
    "max-age=31536000; includeSubDomains",
  );
}

async function main() {
  await testJsonReader();
  testInternalNavigation();
  testUploads();
  testRateLimitPersistence();
  testMenuSchema();
  await testSecurityHeaders();

  const authSource = fs.readFileSync(path.join(root, "lib", "auth.ts"), "utf8");
  const currentUserSource = authSource.slice(
    authSource.indexOf("export async function getCurrentUser"),
    authSource.indexOf("export async function deleteCurrentSession"),
  );
  assert.equal(
    currentUserSource.includes("cookieStore.delete"),
    false,
    "Server Components must not mutate cookies while reading the session",
  );

  console.log("Security regression checks passed.");
}

main()
  .finally(() => {
    db.close();
    fs.rmSync(temporaryRoot, { recursive: true, force: true });
  })
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });

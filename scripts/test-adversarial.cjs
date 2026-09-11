"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const Module = require("node:module");
const ts = require("typescript");
const { deflateRawSync } = require("node:zlib");
const root = path.resolve(__dirname, "..");
const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), "easyqr-adversarial-"));
process.env.DATABASE_PATH = path.join(temporaryRoot, "audit.db");
process.env.NODE_ENV = "production";
process.env.APP_URL = "https://easyqr.test";
const jar = new Map();
const originalResolve = Module._resolveFilename;
Module._resolveFilename = function (request, ...args) {
  return originalResolve.call(this, request.startsWith("@/") ? path.join(root, request.slice(2)) : request, ...args);
};
const originalLoad = Module._load;
Module._load = function (request, ...args) {
  if (request === "next/headers") return { cookies: async () => ({
    get: (name) => jar.has(name) ? { value: jar.get(name) } : undefined,
    set: (name, value) => jar.set(name, value), delete: (name) => jar.delete(name),
  }) };
  return originalLoad.call(this, request, ...args);
};
require.extensions[".ts"] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, "utf8"), {
  compilerOptions: { esModuleInterop: true, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText, filename);
const { db } = require("../lib/db.ts");
const { createSession } = require("../lib/auth.ts");
const { createPasswordResetToken, changePasswordWithCurrentHash, resetPasswordWithToken } = require("../lib/password-reset.ts");
const { getClientAddressFromHeaders } = require("../lib/rate-limit.ts");
const { readJsonRequest } = require("../lib/http.ts");
const { isValidUploadedDataUrl } = require("../lib/upload.ts");
const { defaultTheme, menuThemePresets, demoMenu, getVisibleMenu } = require("../lib/menu.ts");
const { isValidMenuData } = require("../lib/menu-validation.ts");
const { decodePublishedMenu } = require("../lib/menu-link.ts");
const { createUserMenu, getUserMenu, getPublishedMenu } = require("../lib/menus.ts");
const { deleteUserAccount } = require("../lib/account.ts");
const { createMenuSaveQueue } = require("../lib/menu-save-queue.ts");
const { repairThemeAccessibility, getThemeAccessibilityIssues, getReadableSecondaryColor, getColorContrastRatio } = require("../lib/theme-design.ts");
const { parseMenuPrice } = require("../lib/menu-readiness.ts");
const menuRoute = require("../app/api/menus/[id]/route.ts");
const menuCollection = require("../app/api/menus/route.ts");

function seedUser(id) {
  const now = new Date().toISOString();
  db.prepare("INSERT INTO users (id, name, email, password_hash, trial_ends_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)")
    .run(id, "Audit user", `${id}@example.test`, "old-hash", "2099-01-01T00:00:00.000Z", now, now);
}
function request(body, version, origin = process.env.APP_URL) {
  return new Request(`${process.env.APP_URL}/api/menus/test`, {
    method: "PATCH", headers: { "Content-Type": "application/json", Origin: origin, ...(version ? { "If-Match": `"${version}"` } : {}) },
    body: JSON.stringify(body),
  });
}
async function testCredentials() {
  seedUser("credentials");
  await createSession("credentials");
  const old = createPasswordResetToken("credentials");
  assert.equal(changePasswordWithCurrentHash("credentials", "old-hash", "new-hash"), true);
  assert.equal(resetPasswordWithToken(old.token, "attacker-hash"), false, "Old reset links must die after an authenticated password change");
  assert.equal(db.prepare("SELECT COUNT(*) n FROM sessions WHERE user_id = ?").get("credentials").n, 0);
  assert.equal(changePasswordWithCurrentHash("credentials", "old-hash", "stale-hash"), false, "Concurrent changes must not overwrite a newer password");
  assert.equal(deleteUserAccount("credentials", "old-hash"), false, "Old password verification must not authorize deletion");
  assert.equal(db.prepare("SELECT password_hash FROM users WHERE id = ?").get("credentials").password_hash, "new-hash");
}
function testProxyTrust() {
  delete process.env.CLIENT_IP_HEADER;
  const forged = new Headers({ "cf-connecting-ip": "198.51.100.1", "x-forwarded-for": "203.0.113.2", "x-real-ip": "192.0.2.3" });
  assert.equal(getClientAddressFromHeaders(forged), "unknown");
  process.env.CLIENT_IP_HEADER = "x-real-ip";
  assert.equal(getClientAddressFromHeaders(forged), "192.0.2.3", "Unselected spoofed headers cannot override ingress identity");
  forged.set("x-real-ip", "192.0.2.3, 198.51.100.9");
  assert.equal(getClientAddressFromHeaders(forged), "unknown", "A list is not a verified single address");
  delete process.env.CLIENT_IP_HEADER;
}
async function testRequestBounds() {
  let cancelled = false;
  const stalled = new Request("https://easyqr.test/api/test", {
    method: "POST", duplex: "half", headers: { "Content-Type": "application/json" },
    body: new ReadableStream({ cancel() { cancelled = true; } }),
  });
  const result = await readJsonRequest(stalled, 100, 20);
  assert.equal(result.status, 408);
  assert.equal(cancelled, true);
  const bytes = Buffer.alloc(6 * 1024 * 1024, 65); bytes.set([0xff, 0xd8, 0xff]);
  assert.equal(isValidUploadedDataUrl(`data:image/jpeg;base64,${bytes.toString("base64")}`, "image/jpeg", bytes.length), true,
    "Large valid uploads must not overflow the regex stack");
  const malformed = structuredClone(demoMenu); malformed.categories[0].items[0].image = "data:image/png;base64,%%%%";
  assert.equal(isValidMenuData(malformed), false);
  await assert.rejects(() => decodePublishedMenu(`plain.${Buffer.from(JSON.stringify({ menu: { categories: {} }, theme: { accent: "#ffffff" } })).toString("base64url")}`));
  const bomb = deflateRawSync(Buffer.alloc(13 * 1024 * 1024, 32)).toString("base64url");
  await assert.rejects(() => decodePublishedMenu(`zip.${bomb}`), /çok büyük/);
  const payload = { menu: demoMenu, theme: defaultTheme };
  assert.deepEqual((await decodePublishedMenu(`plain.${Buffer.from(JSON.stringify(payload)).toString("base64url")}`)).menu, demoMenu);
}
async function testMenuBoundaries() {
  seedUser("owner"); seedUser("other");
  const original = createUserMenu("owner", demoMenu, defaultTheme);
  const context = { params: Promise.resolve({ id: original.id }) };
  jar.clear();
  assert.equal((await menuRoute.GET(request({}), context)).status, 401);
  await createSession("other");
  assert.equal((await menuRoute.GET(request({}), context)).status, 404);
  assert.equal((await menuRoute.PATCH(request({ menu: demoMenu, theme: defaultTheme }, original.updatedAt), context)).status, 404);
  assert.equal((await menuRoute.DELETE(request({}), context)).status, 404);
  await createSession("owner");
  assert.equal((await menuRoute.PATCH(request({ menu: demoMenu, theme: defaultTheme }), context)).status, 428);
  assert.equal((await menuRoute.PATCH(request({ menu: demoMenu, theme: defaultTheme }, original.updatedAt, "https://evil.test"), context)).status, 403);
  const firstEdit = { ...demoMenu, restaurantName: "First edit" };
  const secondEdit = { ...demoMenu, restaurantName: "Stale edit" };
  const replies = await Promise.all([
    menuRoute.PATCH(request({ menu: firstEdit, theme: defaultTheme }, original.updatedAt), context),
    menuRoute.PATCH(request({ menu: secondEdit, theme: defaultTheme }, original.updatedAt), context),
  ]);
  assert.deepEqual(replies.map((reply) => reply.status).sort(), [200, 409]);
  const saved = getUserMenu("owner", original.id);
  assert.equal(saved.menu.restaurantName, "First edit");
  assert.notEqual(saved.updatedAt, original.updatedAt);
  const publishedResponse = await menuRoute.PATCH(request({ menu: firstEdit, theme: defaultTheme, publish: true }, saved.updatedAt), context);
  assert.equal(publishedResponse.status, 200);
  const published = (await publishedResponse.json()).menu;
  const draft = { ...firstEdit, restaurantName: "Unpublished draft" };
  assert.equal((await menuRoute.PATCH(request({ menu: draft, theme: defaultTheme }, published.updatedAt), context)).status, 200);
  assert.equal(getPublishedMenu(original.slug).menu.restaurantName, "First edit");
  const hidden = structuredClone(draft); hidden.categories[0].items[0].availability = "hidden";
  assert.ok(!getVisibleMenu(hidden).categories.flatMap((c) => c.items).some((i) => i.id === hidden.categories[0].items[0].id));
  assert.equal((await menuCollection.POST(request({ menu: draft, theme: defaultTheme }))).status, 409, "Trial menu cap is enforced at the API boundary");
}
async function testSaveOrdering() {
  const calls = []; const completions = [];
  const queue = createMenuSaveQueue(async (_url, options) => {
    calls.push(options);
    return new Promise((resolve) => completions.push(resolve));
  });
  queue.acknowledge({ id: "menu", updatedAt: "v1" });
  const input = { id: "menu", menu: demoMenu, theme: defaultTheme };
  const first = queue.save(input);
  const second = queue.save({ ...input, publish: true });
  await new Promise(setImmediate);
  assert.equal(calls.length, 1, "No overlapping save requests");
  completions[0](Response.json({ menu: { id: "menu", updatedAt: "v2" } }));
  await first; await new Promise(setImmediate);
  assert.equal(calls[1].headers["If-Match"], '"v2"');
  assert.equal(JSON.parse(calls[1].body).publish, true);
  completions[1](Response.json({ message: "conflict" }, { status: 409 }));
  await assert.rejects(second, /conflict/);
  await assert.rejects(queue.save(input), /başka bir sekmede/);
  assert.equal(calls.length, 2, "Queued stale writes must stop after a conflict");
}
function testPrices() {
  for (const [value, expected] of [["1.250,50",1250.5], ["1,250.50",1250.5], ["150",150], ["150,50",150.5]]) assert.equal(parseMenuPrice(value), expected);
  for (const value of ["1.2.3,45", "1,2,3.45", "1234.567,89", "12.34.567", "150,,50"]) assert.equal(parseMenuPrice(value), null, value);
}
function testContrast() {
  const examples = [...Object.values(menuThemePresets), { ...defaultTheme, text: "#ffffff", accent: "#eeeeee", background: "#ffffff", surface: "#000000" }];
  for (const theme of examples) {
    const repaired = repairThemeAccessibility(theme);
    assert.deepEqual(getThemeAccessibilityIssues(repaired), []);
    const secondary = getReadableSecondaryColor(repaired);
    for (const background of [repaired.background, repaired.surface]) assert.ok(getColorContrastRatio(secondary, background) >= 4.5);
  }
  const css = fs.readFileSync(path.join(root, "app/globals.css"), "utf8");
  const orange = css.match(/--orange: (#[a-f0-9]{6})/)[1];
  assert.ok(getColorContrastRatio(orange, "#ffffff") >= 4.5);
  console.log(`Primary button contrast: ${getColorContrastRatio(orange, "#ffffff").toFixed(2)}:1; ${examples.length} theme cases passed.`);
}
(async () => {
  await testCredentials(); testProxyTrust(); await testRequestBounds();
  await testMenuBoundaries(); await testSaveOrdering(); testPrices(); testContrast();
  console.log("Adversarial checks passed: credential revocation, stale credentials, proxy spoofing, stalled/large/malformed input, decompression cap, tenant isolation, CSRF, optimistic locking, published snapshots, trial cap and serialized saves.");
})().finally(() => { db.close(); fs.rmSync(temporaryRoot, { recursive: true, force: true }); }).catch((error) => { console.error(error); process.exitCode = 1; });

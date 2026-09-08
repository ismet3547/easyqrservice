// Run against a disposable SQLite database; never opens the application's DB.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const Module = require("node:module");
const ts = require("typescript");
const root = path.resolve(__dirname, "..");
const temp = fs.mkdtempSync(path.join(os.tmpdir(), "easyqr-analytics-"));
process.env.DATABASE_PATH = path.join(temp, "test.db");
const originalResolve = Module._resolveFilename;
Module._resolveFilename = function (request, ...args) {
  return originalResolve.call(this, request.startsWith("@/") ? path.join(root, request.slice(2)) : request, ...args);
};
require.extensions[".ts"] = (module, filename) => module._compile(ts.transpileModule(
  fs.readFileSync(filename, "utf8"),
  { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } },
).outputText, filename);

const { db } = require("../lib/db.ts");
const { getEngagementAnalytics } = require("../lib/analytics-details.ts");
const { getUserAnalytics } = require("../lib/analytics.ts");
const now = new Date();
const today = new Date(now);
today.setUTCHours(0, 0, 0, 0);
const day = (offset) => new Date(today.getTime() + offset * 86400000).toISOString();
const current = day(-1);
const previous = day(-7);
const insertUser = db.prepare(
  "INSERT INTO users (id, name, email, password_hash, created_at, updated_at) VALUES (?, ?, ?, 'test-only', ?, ?)",
);
const insertMenu = db.prepare(`INSERT INTO menus
  (id, user_id, name, slug, status, content_json, theme_json, published_content_json,
   published_theme_json, view_count, created_at, updated_at)
  VALUES (?, ?, ?, ?, 'published', ?, '{}', ?, '{}', 50, ?, ?)`);
const insertVisit = db.prepare(`INSERT INTO menu_views
  (menu_id, visit_id, visitor_hash, viewed_at) VALUES (?, ?, ?, ?)`);
const insertEvent = db.prepare(`INSERT INTO menu_events
  (menu_id, visit_id, event_type, category_id, item_id, occurred_at) VALUES (?, ?, ?, ?, ?, ?)`);
const visit = (menu, id, hash, at = current) => insertVisit.run(menu, id, hash, at);
const event = (menu, id, type, item = null, at = current, category = "c") =>
  insertEvent.run(menu, id, type, category, item, at);
const row = (data, name, menu = "a1") => data.products.find((item) => item.menuId === menu && item.name === name);

try {
  insertUser.run("a", "Test A", "a@example.test", current, current);
  insertUser.run("b", "Test B", "b@example.test", current, current);
  insertUser.run("empty", "Empty", "empty@example.test", current, current);
  for (const [id, owner] of [["a1", "a"], ["a2", "a"], ["no-data", "a"], ["b1", "b"]]) {
    const published = {
      restaurantName: `Live ${id}`, subtitle: "", currency: "₺", categories: [{
        id: "c", name: "İçecekler", items: [
          { id: "p", name: "Türk kahvesi", price: "100" },
          { id: "falling", name: "Önceki dönem ürünü", price: "80" },
          { id: "zero", name: "Görülmeyen ürün", price: "50" },
          { id: "hidden", name: "Gizli ürün", price: "70", availability: "hidden" },
        ],
      }],
    };
    const draft = structuredClone(published);
    draft.restaurantName = "Unpublished name";
    draft.categories[0].items[0].name = "Unpublished product";
    insertMenu.run(id, owner, draft.restaurantName, id, JSON.stringify(draft), JSON.stringify(published), current, current);
  }

  visit("a1", "v1", "visitor-one");
  visit("a1", "v2", "visitor-one");
  visit("a1", "v3", "visitor-two");
  visit("a1", "legacy", null);
  visit("a1", "old", "visitor-old", previous);
  visit("a1", "outside", "outside", day(-60));
  visit("a1", "future", "future", day(1));
  visit("a2", "second", "second");
  visit("b1", "foreign", "foreign");
  for (const id of ["v1", "v2"]) {
    event("a1", id, "product_view", "p");
    event("a1", id, "category_view");
  }
  event("a1", "v1", "product_view", "p"); // Duplicate must not inflate reach.
  event("a1", "old", "product_view", "p", previous);
  event("a1", "old", "product_view", "falling", previous);
  event("a1", "old", "category_view", null, previous);
  event("a1", "v3", "product_view", "deleted");
  event("a1", "v3", "product_view", "hidden");
  event("a1", "outside", "product_view", "p", day(-60));
  event("a1", "future", "product_view", "p", day(1));
  event("a2", "second", "product_view", "p");
  event("b1", "foreign", "product_view", "p");
  event("a1", "foreign", "product_view", "p"); // Mismatched menu/visit cannot contribute.

  const scoped = getEngagementAnalytics("a", "a1", now)[7];
  assert.equal(scoped.measuredVisits, 3, "legacy, future and foreign visits excluded");
  assert.equal(row(scoped, "Türk kahvesi").visits, 2);
  assert.equal(row(scoped, "Türk kahvesi").visitors, 1, "repeat visitor counted once");
  assert.equal(row(scoped, "Türk kahvesi").reach, 66.7);
  assert.equal(row(scoped, "Türk kahvesi").previousVisits, 1);
  assert.equal(row(scoped, "Türk kahvesi").menuName, "Live a1", "draft labels cannot leak into live analytics");
  assert.equal(row(scoped, "Önceki dönem ürünü").visits, 0);
  assert.equal(row(scoped, "Önceki dönem ürünü").previousVisits, 1, "declining products remain visible");
  assert.equal(row(scoped, "Görülmeyen ürün").reach, 0, "measured zero stays zero");
  assert.equal(row(scoped, "Gizli ürün").live, false);
  assert.equal(row(scoped, "Kaldırılmış ürün").visits, 1, "removed product events retained");
  assert.equal(scoped.categories[0].visits, 2);
  assert.equal(scoped.categories[0].reach, 66.7);

  const all = getEngagementAnalytics("a", null, now)[7];
  assert.equal(all.measuredVisits, 4);
  assert.equal(row(all, "Türk kahvesi", "a2").reach, 100, "each menu has its own reach denominator");
  assert.ok(all.products.every((item) => item.menuId !== "b1"));
  assert.equal(getEngagementAnalytics("a", "b1", now)[7].products.length, 0);
  assert.equal(getEngagementAnalytics("a", "' OR 1=1 --", now)[7].measuredVisits, 0);
  assert.equal(getEngagementAnalytics("empty", null, now)[7].products.length, 0);
  assert.equal(row(getEngagementAnalytics("a", "no-data", now)[7], "Türk kahvesi", "no-data").reach, null);
  assert.equal(getUserAnalytics("a", 60, "a1").menus.length, 1);
  assert.equal(getUserAnalytics("a", 60, "a1").totalViews, 50);
  assert.equal(getUserAnalytics("a", 60, "b1").totalViews, 0);
  assert.equal(getUserAnalytics("a", 60, "b1").trackingStartedAt, null);
  assert.ok(getUserAnalytics("a", 60, "b1").dailyViews.every((point) => point.views === 0));

  for (const days of [7, 14, 30]) {
    const boundary = new Date(today.getTime() - (days - 1) * 86400000);
    const before = new Date(boundary.getTime() - 1).toISOString();
    const id = `boundary-${days}`;
    visit("no-data", id, id, before);
    event("no-data", id, "product_view", "p", boundary.toISOString());
    const data = getEngagementAnalytics("a", "no-data", now)[days];
    assert.equal(data.previousStart, new Date(boundary.getTime() - days * 86400000).toISOString());
    const product = row(data, "Türk kahvesi", "no-data");
    assert.equal(product.previousVisits, 1, "midnight-spanning event belongs to the visit's opening period");
    assert.equal(product.visits, days === 7 ? 0 : days === 14 ? 1 : 2);
  }
  console.log("Analytics integration passed: scope/isolation, snapshots, unique visitors, dedupe, reach, history, empty states, and 7/14/30-day boundaries.");
} finally {
  db.close();
  fs.rmSync(temp, { recursive: true, force: true });
}

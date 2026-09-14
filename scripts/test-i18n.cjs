"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");
const ts = require("typescript");

const root = path.resolve(__dirname, "..");
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

const {
  defaultAppLocale,
  getAppLocaleFromPathname,
  getLocalizedAppPath,
  getLocalizedCounterpartPath,
  resolveAcceptLanguage,
  resolveRequestLocale,
} = require("../lib/i18n.ts");
const { createPasswordResetUrl } = require("../lib/email.ts");
const { getMenuReadiness, parseMenuPrice } = require("../lib/menu-readiness.ts");
const { createMenuFromStarter, getMenuStarters } = require("../lib/menu-starters.ts");
const {
  demoMenu,
  demoMenuTr,
  formatMenuPrice,
  getDemoMenu,
  getMenuInterfaceLanguage,
  getMenuTextDirection,
  normalizeMenuSearchText,
  normalizeMenuSlug,
  resolveMenuDisplayLanguage,
} = require("../lib/menu.ts");
const { getLegalConfig, getLegalDocumentDateLabel } = require("../lib/legal.ts");
const { getOnboardingProgress, getQrCenterPath, getStudioMenuPath } = require("../lib/onboarding.ts");

delete process.env.LEGAL_ENTITY_NAME;
delete process.env.LEGAL_CONTACT_EMAIL;
delete process.env.LEGAL_ADDRESS;

assert.equal(defaultAppLocale, "en");
assert.equal(resolveAcceptLanguage(null), "en");
assert.equal(resolveAcceptLanguage("tr-TR;q=0.9,en-US;q=1"), "en");
assert.equal(resolveAcceptLanguage("de-DE, tr;q=0.8"), "tr");
assert.equal(resolveAcceptLanguage("fr-FR, de;q=0.8"), "en");
assert.equal(
  resolveRequestLocale(new Request("https://easyqr.test", {
    headers: { "accept-language": "en", cookie: "other=1; easyqr-locale=tr" },
  })),
  "tr",
);
assert.equal(
  resolveRequestLocale(new Request("https://easyqr.test", {
    headers: { "accept-language": "tr", cookie: "easyqr-locale=fr" },
  })),
  "tr",
);

assert.equal(getLocalizedAppPath("en", "login"), "/login");
assert.equal(getLocalizedAppPath("tr", "login"), "/giris");
assert.equal(getAppLocaleFromPathname("/privacy"), "en");
assert.equal(getAppLocaleFromPathname("/gizlilik/"), "tr");
assert.equal(getLocalizedCounterpartPath("/forgot-password", "tr"), "/sifremi-unuttum");
assert.equal(getLocalizedCounterpartPath("/dashboard", "tr"), null);

assert.equal(getDemoMenu("en"), demoMenu);
assert.equal(getDemoMenu("tr"), demoMenuTr);
assert.equal(demoMenu.sourceLanguage, "en");
assert.equal(demoMenu.currency, "$");
assert.equal(demoMenuTr.sourceLanguage, "tr");
assert.equal(demoMenuTr.currency, "₺");
assert.equal(getMenuInterfaceLanguage({ ...demoMenu, sourceLanguage: undefined }), "tr");
assert.equal(getMenuInterfaceLanguage({ ...demoMenu, sourceLanguage: "tr-TR" }), "tr");
assert.equal(getMenuTextDirection("ar"), "rtl");
assert.equal(getMenuTextDirection("he-IL"), "rtl");
assert.equal(getMenuTextDirection("en-US"), "ltr");
assert.equal(formatMenuPrice("10", "$", "en"), "$10");
assert.equal(formatMenuPrice("10", "£", "en"), "£10");
assert.equal(formatMenuPrice("10", "₺", "tr"), "10₺");
assert.equal(formatMenuPrice("10", "€", "en"), "€10");
assert.equal(formatMenuPrice("10", "€", "es"), "10€");
assert.equal(formatMenuPrice("10", "USD", "en"), "USD\u00a010");
assert.equal(normalizeMenuSearchText("CAFÉ İSTANBUL"), "cafe istanbul");
assert.equal(normalizeMenuSearchText("北京 烤鸭"), "北京 烤鸭");
assert.equal(normalizeMenuSearchText("قهوة عربية"), "قهوة عربية");
assert.equal(normalizeMenuSlug("INDIGO İSTANBUL"), "indigo-istanbul");
assert.equal(parseMenuPrice("١٬٢٥٠٫٥٠ ر.س", "ر.س"), 1250.5);
assert.equal(parseMenuPrice("₹१,२५०.५०", "₹"), 1250.5);
assert.equal(parseMenuPrice("１２５０．５０円", "円"), 1250.5);
const spanishMenu = { ...demoMenu, sourceLanguage: "es", translations: { en: {} } };
assert.equal(getMenuInterfaceLanguage(spanishMenu), "en");
assert.equal(resolveMenuDisplayLanguage(spanishMenu, "es-ES,en;q=0.8"), "source");
assert.equal(resolveMenuDisplayLanguage(spanishMenu, "en-US,es;q=0.8"), "en");
assert.equal(resolveMenuDisplayLanguage(spanishMenu, "de-DE"), "en");
assert.equal(resolveMenuDisplayLanguage({ ...spanishMenu, translations: undefined }, "en"), "source");

assert.equal(getMenuStarters("en")[0].label, "Restaurant");
assert.equal(getMenuStarters("tr")[0].label, "Restoran");
const englishStarter = createMenuFromStarter("cafe", "North Star", "$", "en");
const turkishStarter = createMenuFromStarter("cafe", "Kuzey", "₺", "tr");
assert.equal(englishStarter.sourceLanguage, "en");
assert.equal(englishStarter.currency, "$");
assert.equal(turkishStarter.sourceLanguage, "tr");
assert.equal(turkishStarter.currency, "₺");

assert.equal(
  getMenuReadiness(demoMenu, "en").recommendations.some((issue) => issue.id === "english-translation"),
  false,
);
assert.equal(
  getMenuReadiness(demoMenuTr, "tr").recommendations.some((issue) => issue.id === "english-translation"),
  true,
);

process.env.APP_URL = "https://menu.example.test";
assert.equal(new URL(createPasswordResetUrl("A".repeat(43))).pathname, "/reset-password");
assert.equal(new URL(createPasswordResetUrl("A".repeat(43), "tr")).pathname, "/sifre-sifirla");
assert.equal(getLegalDocumentDateLabel("en"), "September 12, 2026");
assert.equal(getLegalDocumentDateLabel("tr"), "12 Eylül 2026");
assert.match(getLegalConfig("en").entityName, /before launch/);
assert.match(getLegalConfig("tr").entityName, /canlı ortamda/);

const draftMenu = { id: "menu / 1", name: "North Star", status: "draft", viewCount: 0 };
const publishedMenu = { ...draftMenu, status: "published" };
assert.equal(getStudioMenuPath(draftMenu.id, true), "/studio?menu=menu%20%2F%201&onboarding=1");
assert.equal(getQrCenterPath(draftMenu.id, true), "/dashboard/menus/menu%20%2F%201/qr?onboarding=1");
assert.equal(getOnboardingProgress([], "en").nextAction.href, "/studio?new=1&onboarding=1");
assert.equal(getOnboardingProgress([draftMenu], "en").nextAction.href, "/studio?menu=menu%20%2F%201&onboarding=1&publish=1");
assert.equal(getOnboardingProgress([publishedMenu], "en").nextAction.href, "/dashboard/menus/menu%20%2F%201/qr?onboarding=1");
assert.equal(getOnboardingProgress([{ ...publishedMenu, viewCount: 1 }], "en").isComplete, true);

console.log("Internationalization checks passed: locale negotiation, localized routes, activation paths, legacy menus, Unicode search/prices, RTL, starters, reset URLs, and legal copy.");

"use strict";

const { parseNamedArguments } = require("./database-backup-utils.cjs");

function normalizePublicOrigin(value) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error("--url veya APP_URL ile canlı adres gerekli.");
  }
  const url = new URL(value.trim());
  if (url.protocol !== "https:") {
    throw new Error("Canlı smoke testi HTTPS adresi gerektirir.");
  }
  if (
    url.username || url.password || url.pathname !== "/" ||
    url.search || url.hash
  ) {
    throw new Error("Canlı adres yalnızca HTTPS origin içermelidir.");
  }
  return url.origin;
}

async function runProductionSmoke(options = {}) {
  const origin = normalizePublicOrigin(options.baseUrl || process.env.APP_URL);
  const fetchImplementation = options.fetchImplementation || fetch;
  const timeoutMs = options.timeoutMs || 10_000;
  const checks = [];

  async function request(pathname) {
    const response = await fetchImplementation(`${origin}${pathname}`, {
      headers: { "User-Agent": "EasyQR-Production-Smoke/1.0" },
      redirect: "manual",
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (response.status !== 200) {
      throw new Error(`${pathname} beklenen 200 yerine ${response.status} döndürdü.`);
    }
    checks.push(pathname);
    return response;
  }

  const health = await request("/api/health");
  const healthBody = await health.json();
  if (healthBody?.status !== "ok") {
    throw new Error("/api/health veritabanı hazır durumunu doğrulamadı.");
  }
  if (!health.headers.get("cache-control")?.toLowerCase().includes("no-store")) {
    throw new Error("/api/health yanıtı no-store olarak işaretlenmemiş.");
  }

  const homepage = await request("/");
  const requiredHeaders = [
    ["content-security-policy", "default-src 'self'"],
    ["strict-transport-security", "max-age="],
    ["referrer-policy", "strict-origin-when-cross-origin"],
    ["x-content-type-options", "nosniff"],
    ["x-frame-options", "SAMEORIGIN"],
  ];
  for (const [header, expected] of requiredHeaders) {
    const actual = homepage.headers.get(header) || "";
    if (!actual.toLowerCase().includes(expected.toLowerCase())) {
      throw new Error(`Ana sayfada ${header} güvenlik başlığı eksik veya geçersiz.`);
    }
  }
  if (homepage.headers.has("x-powered-by")) {
    throw new Error("Ana sayfa teknoloji bilgisini X-Powered-By ile açığa çıkarıyor.");
  }

  const robots = await request("/robots.txt");
  const robotsBody = await robots.text();
  if (!robotsBody.includes(`Sitemap: ${origin}/sitemap.xml`)) {
    throw new Error("robots.txt canlı origin için sitemap adresini içermiyor.");
  }

  const sitemap = await request("/sitemap.xml");
  const sitemapBody = await sitemap.text();
  if (!sitemapBody.includes(`<loc>${origin}</loc>`)) {
    throw new Error("sitemap.xml canlı origin ana sayfasını içermiyor.");
  }

  for (const pathname of ["/privacy", "/cookies", "/terms"]) {
    const response = await request(pathname);
    if (!response.headers.get("content-type")?.toLowerCase().includes("text/html")) {
      throw new Error(`${pathname} HTML yanıtı döndürmedi.`);
    }
  }

  return { status: "ok", origin, checks };
}

if (require.main === module) {
  const argumentsMap = parseNamedArguments(process.argv.slice(2));
  runProductionSmoke({ baseUrl: argumentsMap.url || process.env.APP_URL })
    .then((result) => console.log(JSON.stringify(result)))
    .catch((error) => {
      console.error(`Canlı smoke testi başarısız: ${error instanceof Error ? error.message : error}`);
      process.exitCode = 1;
    });
}

module.exports = { normalizePublicOrigin, runProductionSmoke };

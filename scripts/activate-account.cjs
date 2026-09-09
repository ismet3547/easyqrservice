"use strict";

const fs = require("node:fs");
const path = require("node:path");
const Database = require("better-sqlite3");

try {
  require("@next/env").loadEnvConfig(process.cwd(), false);
} catch (error) {
  if (error && error.code !== "MODULE_NOT_FOUND") throw error;
}

function option(name) {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

const email = (option("email") || "").trim().toLocaleLowerCase("en-US");
const daysValue = option("days") || "30";
if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  throw new Error("Geçerli bir --email değeri girilmelidir.");
}
if (!/^\d+$/.test(daysValue)) {
  throw new Error("--days tam sayı olmalıdır.");
}
const days = Number(daysValue);
if (!Number.isSafeInteger(days) || days < 1 || days > 366) {
  throw new Error("--days 1-366 aralığında olmalıdır.");
}

const databasePath = path.resolve(
  process.env.DATABASE_PATH || path.join(process.cwd(), ".data", "easyqr.db"),
);
if (!fs.existsSync(databasePath)) {
  throw new Error(`Veritabanı bulunamadı: ${databasePath}`);
}

const database = new Database(databasePath);
try {
  const columns = new Set(database.prepare("PRAGMA table_info(users)").all().map((column) => column.name));
  if (!columns.has("plan") || !columns.has("plan_expires_at")) {
    throw new Error("Plan göçü henüz uygulanmamış. Önce uygulamayı bir kez başlat.");
  }

  const user = database.prepare(
    "SELECT id, email, plan, plan_expires_at FROM users WHERE email = ?",
  ).get(email);
  if (!user) throw new Error("Bu e-posta adresiyle bir hesap bulunamadı.");

  const now = new Date();
  const currentExpiry = Date.parse(user.plan_expires_at || "");
  const startsAt = user.plan === "pro" && Number.isFinite(currentExpiry) && currentExpiry > now.getTime()
    ? currentExpiry
    : now.getTime();
  const expiresAt = new Date(startsAt + days * 24 * 60 * 60 * 1000).toISOString();

  database.prepare(
    "UPDATE users SET plan = 'pro', plan_expires_at = ?, updated_at = ? WHERE id = ?",
  ).run(expiresAt, now.toISOString(), user.id);

  console.log(`Pro erişimi etkinleştirildi: ${user.email} · ${days} gün · bitiş ${expiresAt}`);
} finally {
  database.close();
}

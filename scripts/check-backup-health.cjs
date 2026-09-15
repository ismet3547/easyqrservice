"use strict";

const fs = require("node:fs");
const path = require("node:path");
const {
  checksumFilePath,
  resolveRequiredPath,
} = require("./database-backup-utils.cjs");

const backupNamePattern = /^easyqr-\d{8}T\d{9}Z-[a-f0-9]{8}\.sqlite3$/i;

function readIntervalHours(value) {
  const normalized = value === undefined || value === "" ? "24" : String(value);
  if (!/^\d+$/.test(normalized)) {
    throw new Error("BACKUP_INTERVAL_HOURS tam sayı olmalıdır.");
  }
  const hours = Number(normalized);
  if (!Number.isSafeInteger(hours) || hours < 1 || hours > 168) {
    throw new Error("BACKUP_INTERVAL_HOURS 1-168 aralığında olmalıdır.");
  }
  return hours;
}

function resolveBackupDirectory(options) {
  if (options.backupDirectory || process.env.BACKUP_DIR) {
    return resolveRequiredPath(
      options.backupDirectory || process.env.BACKUP_DIR,
      "BACKUP_DIR",
    );
  }
  const databasePath = resolveRequiredPath(
    options.databasePath || process.env.DATABASE_PATH,
    "DATABASE_PATH",
  );
  return path.join(path.dirname(databasePath), "backups");
}

function checkBackupHealth(options = {}) {
  const backupDirectory = resolveBackupDirectory(options);
  const directoryStat = fs.statSync(backupDirectory, { throwIfNoEntry: false });
  if (!directoryStat?.isDirectory()) {
    throw new Error(`Yedek dizini bulunamadı: ${backupDirectory}`);
  }

  const candidates = fs.readdirSync(backupDirectory, { withFileTypes: true })
    .filter((entry) => entry.isFile() && backupNamePattern.test(entry.name))
    .map((entry) => {
      const filePath = path.join(backupDirectory, entry.name);
      return { filePath, name: entry.name, stat: fs.statSync(filePath) };
    })
    .sort((left, right) => right.stat.mtimeMs - left.stat.mtimeMs);
  const latest = candidates[0];
  if (!latest) throw new Error("Henüz doğrulanabilir bir EasyQR yedeği yok.");
  if (latest.stat.size <= 0) throw new Error("En yeni EasyQR yedeği boş.");

  const checksumPath = checksumFilePath(latest.filePath);
  const checksumStat = fs.statSync(checksumPath, { throwIfNoEntry: false });
  if (!checksumStat?.isFile()) {
    throw new Error(`En yeni yedeğin checksum dosyası yok: ${checksumPath}`);
  }
  const checksum = fs.readFileSync(checksumPath, "utf8").trim();
  const checksumMatch = /^([a-f0-9]{64})\s+(.+)$/i.exec(checksum);
  if (!checksumMatch || checksumMatch[2] !== latest.name) {
    throw new Error("En yeni yedeğin checksum kaydı geçersiz.");
  }

  const now = options.now instanceof Date ? options.now : new Date();
  const ageMs = now.getTime() - latest.stat.mtimeMs;
  if (ageMs < -5 * 60 * 1000) {
    throw new Error("En yeni yedeğin zamanı sistem saatinden ileride.");
  }
  const intervalHours = readIntervalHours(
    options.intervalHours ?? process.env.BACKUP_INTERVAL_HOURS,
  );
  const intervalMs = intervalHours * 60 * 60 * 1000;
  const graceMs = Math.max(
    15 * 60 * 1000,
    Math.min(60 * 60 * 1000, Math.ceil(intervalMs * 0.1)),
  );
  if (ageMs > intervalMs + graceMs) {
    throw new Error(
      `En yeni EasyQR yedeği gecikmiş (${Math.floor(ageMs / 60000)} dakika).`,
    );
  }

  return {
    status: "ok",
    backup: latest.filePath,
    bytes: latest.stat.size,
    ageSeconds: Math.max(0, Math.floor(ageMs / 1000)),
    intervalHours,
  };
}

if (require.main === module) {
  try {
    console.log(JSON.stringify(checkBackupHealth()));
  } catch (error) {
    console.error(`Yedekleme sağlık kontrolü başarısız: ${error instanceof Error ? error.message : error}`);
    process.exitCode = 1;
  }
}

module.exports = { checkBackupHealth, readIntervalHours };

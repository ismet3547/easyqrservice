"use strict";

const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const Database = require("better-sqlite3");
const {
  checksumFilePath,
  resolveRequiredPath,
  verifyDatabaseFile,
  writeChecksum,
} = require("./database-backup-utils.cjs");

function readBoundedInteger(value, fallback, minimum, maximum, name) {
  if (value === undefined || value === "") return fallback;
  if (!/^\d+$/.test(String(value))) throw new Error(`${name} tam sayı olmalıdır.`);
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < minimum || parsed > maximum) {
    throw new Error(`${name} ${minimum}-${maximum} aralığında olmalıdır.`);
  }
  return parsed;
}

function backupFileName(now) {
  const timestamp = now.toISOString().replace(/[-:.]/g, "");
  return `easyqr-${timestamp}-${crypto.randomBytes(4).toString("hex")}.sqlite3`;
}

function pruneBackups(directory, retentionDays, maximumFiles, now) {
  const candidates = fs.readdirSync(directory, { withFileTypes: true })
    .filter((entry) => entry.isFile() && /^easyqr-\d{8}T\d{9}Z-[a-f0-9]{8}\.sqlite3$/i.test(entry.name))
    .map((entry) => {
      const filePath = path.join(directory, entry.name);
      return { filePath, name: entry.name, modifiedAt: fs.statSync(filePath).mtimeMs };
    })
    .sort((left, right) => right.modifiedAt - left.modifiedAt);
  const cutoff = now.getTime() - retentionDays * 24 * 60 * 60 * 1000;
  const removed = [];

  candidates.forEach((candidate, index) => {
    const mustKeep = index < 2;
    const exceedsCount = index >= maximumFiles;
    const expired = candidate.modifiedAt < cutoff;
    if (mustKeep || (!exceedsCount && !expired)) return;

    fs.unlinkSync(candidate.filePath);
    fs.rmSync(checksumFilePath(candidate.filePath), { force: true });
    removed.push(candidate.name);
  });
  return removed;
}

async function createDatabaseBackup(options = {}) {
  const databasePath = resolveRequiredPath(
    options.databasePath || process.env.DATABASE_PATH,
    "DATABASE_PATH",
  );
  const backupDirectory = resolveRequiredPath(
    options.backupDirectory || process.env.BACKUP_DIR || path.join(path.dirname(databasePath), "backups"),
    "BACKUP_DIR",
  );
  if (databasePath === backupDirectory) {
    throw new Error("BACKUP_DIR veritabanı dosyasıyla aynı yol olamaz.");
  }
  const sourceStat = fs.statSync(databasePath, { throwIfNoEntry: false });
  if (!sourceStat?.isFile()) throw new Error(`Kaynak veritabanı bulunamadı: ${databasePath}`);

  const retentionDays = readBoundedInteger(
    options.retentionDays ?? process.env.BACKUP_RETENTION_DAYS,
    14,
    1,
    365,
    "BACKUP_RETENTION_DAYS",
  );
  const maximumFiles = readBoundedInteger(
    options.maximumFiles ?? process.env.BACKUP_MAX_FILES,
    30,
    2,
    365,
    "BACKUP_MAX_FILES",
  );
  const now = options.now instanceof Date ? options.now : new Date();

  fs.mkdirSync(backupDirectory, { recursive: true, mode: 0o700 });
  try { fs.chmodSync(backupDirectory, 0o700); } catch {}

  const fileName = backupFileName(now);
  const finalPath = path.join(backupDirectory, fileName);
  const temporaryPath = path.join(backupDirectory, `.${fileName}.${process.pid}.tmp`);
  const source = new Database(databasePath, { readonly: true, fileMustExist: true });
  let checksumPath = "";
  let finalFileCreated = false;
  try {
    await source.backup(temporaryPath);
    fs.chmodSync(temporaryPath, 0o600);
    verifyDatabaseFile(temporaryPath, { requireChecksum: false });
    // A same-directory hard link publishes the verified backup without ever
    // replacing an existing path, even in the unlikely event of a name race.
    fs.linkSync(temporaryPath, finalPath);
    finalFileCreated = true;
    fs.unlinkSync(temporaryPath);
    fs.utimesSync(finalPath, now, now);
    checksumPath = writeChecksum(finalPath).checksumPath;
    const verified = verifyDatabaseFile(finalPath);
    let removed = [];
    let pruneWarning = "";
    try {
      removed = pruneBackups(backupDirectory, retentionDays, maximumFiles, now);
    } catch (error) {
      pruneWarning = error instanceof Error ? error.message : String(error);
    }
    return { ...verified, checksumPath, removed, pruneWarning };
  } catch (error) {
    fs.rmSync(temporaryPath, { force: true });
    if (finalFileCreated) fs.rmSync(finalPath, { force: true });
    if (checksumPath) fs.rmSync(checksumPath, { force: true });
    throw error;
  } finally {
    source.close();
  }
}

if (require.main === module) {
  createDatabaseBackup()
    .then((result) => {
      console.log(JSON.stringify({
        status: "ok",
        backup: result.filePath,
        bytes: result.bytes,
        checksum: result.checksum,
        removed: result.removed,
        pruneWarning: result.pruneWarning || undefined,
      }));
    })
    .catch((error) => {
      console.error(`Veritabanı yedeklenemedi: ${error instanceof Error ? error.message : error}`);
      process.exitCode = 1;
    });
}

module.exports = { createDatabaseBackup, pruneBackups };

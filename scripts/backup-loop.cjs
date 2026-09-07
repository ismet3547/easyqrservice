"use strict";

const { createDatabaseBackup } = require("./backup-database.cjs");

function readIntervalMilliseconds() {
  const value = process.env.BACKUP_INTERVAL_HOURS || "24";
  if (!/^\d+$/.test(value)) throw new Error("BACKUP_INTERVAL_HOURS tam sayı olmalıdır.");
  const hours = Number(value);
  if (!Number.isSafeInteger(hours) || hours < 1 || hours > 168) {
    throw new Error("BACKUP_INTERVAL_HOURS 1-168 aralığında olmalıdır.");
  }
  return hours * 60 * 60 * 1000;
}

let stopping = false;
let pendingTimer = null;
let resolvePendingWait = null;
for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    stopping = true;
    if (pendingTimer) clearTimeout(pendingTimer);
    if (resolvePendingWait) resolvePendingWait();
  });
}

function wait(milliseconds) {
  return new Promise((resolve) => {
    resolvePendingWait = () => {
      pendingTimer = null;
      resolvePendingWait = null;
      resolve();
    };
    pendingTimer = setTimeout(resolvePendingWait, milliseconds);
  });
}

async function runBackupLoop() {
  const interval = readIntervalMilliseconds();
  while (!stopping) {
    try {
      const result = await createDatabaseBackup();
      console.log(JSON.stringify({
        status: "ok",
        backup: result.filePath,
        bytes: result.bytes,
        removed: result.removed,
        pruneWarning: result.pruneWarning || undefined,
      }));
    } catch (error) {
      console.error(`Otomatik yedekleme başarısız: ${error instanceof Error ? error.message : error}`);
    }
    if (!stopping) await wait(interval);
  }
}

if (require.main === module) {
  runBackupLoop().catch((error) => {
    console.error(`Yedekleme çalışanı durdu: ${error instanceof Error ? error.message : error}`);
    process.exitCode = 1;
  });
}

module.exports = { readIntervalMilliseconds, runBackupLoop };

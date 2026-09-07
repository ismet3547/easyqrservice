"use strict";

const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const {
  checksumFilePath,
  parseNamedArguments,
  resolveRequiredPath,
  verifyDatabaseFile,
  writeChecksum,
} = require("./database-backup-utils.cjs");

function restoreDatabase(options = {}) {
  const sourcePath = resolveRequiredPath(options.sourcePath, "Kaynak yedek");
  const targetPath = resolveRequiredPath(options.targetPath, "Hedef veritabanı");
  if (sourcePath === targetPath) throw new Error("Kaynak ve hedef aynı dosya olamaz.");
  if (fs.existsSync(targetPath) || fs.existsSync(checksumFilePath(targetPath))) {
    throw new Error("Hedef dosya veya checksum zaten var. Geri yükleme mevcut verinin üzerine yazmaz.");
  }

  const source = verifyDatabaseFile(sourcePath);
  const targetDirectory = path.dirname(targetPath);
  fs.mkdirSync(targetDirectory, { recursive: true, mode: 0o700 });
  const temporaryPath = path.join(
    targetDirectory,
    `.${path.basename(targetPath)}.${crypto.randomBytes(4).toString("hex")}.tmp`,
  );
  let checksumPath = "";
  let targetCreated = false;
  try {
    fs.copyFileSync(sourcePath, temporaryPath, fs.constants.COPYFILE_EXCL);
    fs.chmodSync(temporaryPath, 0o600);
    verifyDatabaseFile(temporaryPath, { requireChecksum: false });
    // Publish atomically without POSIX rename's replace-existing behaviour.
    fs.linkSync(temporaryPath, targetPath);
    targetCreated = true;
    fs.unlinkSync(temporaryPath);
    checksumPath = writeChecksum(targetPath).checksumPath;
    const restored = verifyDatabaseFile(targetPath);
    return { source, restored, checksumPath };
  } catch (error) {
    fs.rmSync(temporaryPath, { force: true });
    if (targetCreated) fs.rmSync(targetPath, { force: true });
    if (checksumPath) fs.rmSync(checksumPath, { force: true });
    throw error;
  }
}

if (require.main === module) {
  try {
    const argumentsMap = parseNamedArguments(process.argv.slice(2));
    const result = restoreDatabase({
      sourcePath: argumentsMap.source,
      targetPath: argumentsMap.target,
    });
    console.log(JSON.stringify({
      status: "ok",
      source: result.source.filePath,
      restored: result.restored.filePath,
      bytes: result.restored.bytes,
      checksum: result.restored.checksum,
    }));
  } catch (error) {
    console.error(`Veritabanı geri yüklenemedi: ${error instanceof Error ? error.message : error}`);
    console.error(
      "Kullanım: npm run db:restore -- --source /yedek.sqlite3 --target /yeni/easyqr.db",
    );
    process.exitCode = 1;
  }
}

module.exports = { restoreDatabase };

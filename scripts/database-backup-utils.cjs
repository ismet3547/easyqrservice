"use strict";

const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const Database = require("better-sqlite3");

function resolveRequiredPath(value, label) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${label} yolu zorunludur.`);
  }
  return path.resolve(value.trim());
}

function checksumFilePath(databaseFile) {
  return `${databaseFile}.sha256`;
}

function calculateSha256(filePath) {
  return crypto.createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
}

function writeChecksum(filePath) {
  const checksum = calculateSha256(filePath);
  const checksumPath = checksumFilePath(filePath);
  fs.writeFileSync(checksumPath, `${checksum}  ${path.basename(filePath)}\n`, {
    encoding: "utf8",
    mode: 0o600,
    flag: "wx",
  });
  return { checksum, checksumPath };
}

function readExpectedChecksum(filePath, required) {
  const checksumPath = checksumFilePath(filePath);
  if (!fs.existsSync(checksumPath)) {
    if (required) throw new Error(`Yedek checksum dosyası bulunamadı: ${checksumPath}`);
    return null;
  }
  const contents = fs.readFileSync(checksumPath, "utf8").trim();
  const match = /^([a-f0-9]{64})(?:\s+.+)?$/i.exec(contents);
  if (!match) throw new Error(`Yedek checksum dosyası geçersiz: ${checksumPath}`);
  return match[1].toLowerCase();
}

function verifyDatabaseFile(fileValue, options = {}) {
  const filePath = resolveRequiredPath(fileValue, "Veritabanı");
  const requiredChecksum = options.requireChecksum !== false;
  const stat = fs.statSync(filePath, { throwIfNoEntry: false });
  if (!stat?.isFile()) throw new Error(`Veritabanı dosyası bulunamadı: ${filePath}`);

  const expectedChecksum = readExpectedChecksum(filePath, requiredChecksum);
  const checksum = calculateSha256(filePath);
  if (expectedChecksum && checksum !== expectedChecksum) {
    throw new Error("Yedek checksum doğrulamasını geçemedi.");
  }

  const database = new Database(filePath, { readonly: true, fileMustExist: true });
  try {
    const rows = database.pragma("integrity_check");
    const messages = rows.map((row) => String(row.integrity_check));
    if (messages.length !== 1 || messages[0] !== "ok") {
      throw new Error(`SQLite bütünlük kontrolü başarısız: ${messages.join(", ")}`);
    }
    const tableCount = database.prepare(
      "SELECT COUNT(*) AS count FROM sqlite_master WHERE type = 'table'",
    ).get().count;
    return {
      filePath,
      checksum,
      bytes: stat.size,
      tableCount,
    };
  } finally {
    database.close();
  }
}

function parseNamedArguments(argumentsList) {
  const values = {};
  for (let index = 0; index < argumentsList.length; index += 1) {
    const argument = argumentsList[index];
    if (!argument.startsWith("--")) continue;
    const name = argument.slice(2);
    const value = argumentsList[index + 1];
    if (!value || value.startsWith("--")) throw new Error(`--${name} için değer gerekli.`);
    values[name] = value;
    index += 1;
  }
  return values;
}

module.exports = {
  calculateSha256,
  checksumFilePath,
  parseNamedArguments,
  resolveRequiredPath,
  verifyDatabaseFile,
  writeChecksum,
};

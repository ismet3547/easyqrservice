"use strict";

const { parseNamedArguments, verifyDatabaseFile } = require("./database-backup-utils.cjs");

function resolveSource(argumentsList) {
  const named = parseNamedArguments(argumentsList);
  return named.source || argumentsList.find((argument) => !argument.startsWith("--"));
}

if (require.main === module) {
  try {
    const source = resolveSource(process.argv.slice(2));
    const result = verifyDatabaseFile(source);
    console.log(JSON.stringify({
      status: "ok",
      backup: result.filePath,
      bytes: result.bytes,
      checksum: result.checksum,
      tables: result.tableCount,
    }));
  } catch (error) {
    console.error(`Yedek doğrulanamadı: ${error instanceof Error ? error.message : error}`);
    console.error("Kullanım: npm run db:verify -- --source /mutlak/yol/yedek.sqlite3");
    process.exitCode = 1;
  }
}

module.exports = { resolveSource };

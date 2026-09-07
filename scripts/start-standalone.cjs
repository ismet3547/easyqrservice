"use strict";

const path = require("node:path");
const {
  assertProductionEnv,
  loadNextEnvironment,
} = require("./production-env.cjs");

loadNextEnvironment();

try {
  const result = assertProductionEnv(process.env);
  for (const warning of result.warnings) console.warn(`Uyarı: ${warning}`);
  console.log("Canlı ortam yapılandırması doğrulandı; EasyQR başlatılıyor.");
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}

require(path.join(process.cwd(), "server.js"));

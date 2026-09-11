"use strict";

const os = require("node:os");
const path = require("node:path");

function loadNextEnvironment(directory = process.cwd()) {
  try {
    require("@next/env").loadEnvConfig(directory, false);
  } catch (error) {
    if (error && error.code !== "MODULE_NOT_FOUND") throw error;
  }
}

function parseBoolean(value, name, errors, fallback = false) {
  if (value === undefined || value === "") return fallback;
  if (value === "true") return true;
  if (value === "false") return false;
  errors.push(`${name} yalnızca true veya false olabilir.`);
  return fallback;
}

function parseInteger(value, name, fallback, minimum, maximum, errors) {
  if (value === undefined || value === "") return fallback;
  if (!/^\d+$/.test(value)) {
    errors.push(`${name} tam sayı olmalıdır.`);
    return fallback;
  }
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < minimum || parsed > maximum) {
    errors.push(`${name} ${minimum}-${maximum} aralığında olmalıdır.`);
    return fallback;
  }
  return parsed;
}

function validateProductionEnv(environment, options = {}) {
  const cwd = options.cwd || process.cwd();
  const errors = [];
  const warnings = [];

  const clientIpHeader = environment.CLIENT_IP_HEADER?.trim().toLowerCase() || "";
  if (clientIpHeader && !["cf-connecting-ip", "x-forwarded-for", "x-real-ip"].includes(clientIpHeader)) {
    errors.push("CLIENT_IP_HEADER yalnızca cf-connecting-ip, x-forwarded-for veya x-real-ip olabilir.");
  }
  if (!clientIpHeader) {
    warnings.push("CLIENT_IP_HEADER ayarlanmamış; tüm ziyaretçiler ortak IP limitini paylaşır. Güvenilir proxy kurulumunu tamamla.");
  }

  const appUrlValue = environment.APP_URL?.trim() || "";
  let appOrigin = "";
  if (!appUrlValue) {
    errors.push("APP_URL zorunludur.");
  } else {
    try {
      const parsed = new URL(appUrlValue);
      const isLocal = ["localhost", "127.0.0.1", "::1", "[::1]"].includes(parsed.hostname);
      if (parsed.protocol !== "https:" && !(isLocal && parsed.protocol === "http:")) {
        errors.push("APP_URL canlı ortamda HTTPS kullanmalıdır.");
      }
      if (
        parsed.username || parsed.password || parsed.pathname !== "/" ||
        parsed.search || parsed.hash
      ) {
        errors.push("APP_URL yalnızca origin içermelidir; yol, kullanıcı bilgisi veya sorgu içeremez.");
      }
      appOrigin = parsed.origin;
    } catch {
      errors.push("APP_URL geçerli bir mutlak URL olmalıdır.");
    }
  }

  const databaseValue = environment.DATABASE_PATH?.trim() || "";
  let databasePath = "";
  if (!databaseValue) {
    errors.push("DATABASE_PATH canlı ortamda zorunludur.");
  } else if (!path.isAbsolute(databaseValue)) {
    errors.push("DATABASE_PATH canlı ortamda mutlak bir yol olmalıdır.");
  } else if (databaseValue === ":memory:") {
    errors.push("DATABASE_PATH kalıcı bir dosyayı göstermelidir; :memory: kullanılamaz.");
  } else {
    databasePath = path.normalize(databaseValue);
    const relativeToTemp = path.relative(path.resolve(os.tmpdir()), databasePath);
    if (relativeToTemp === "" || (!relativeToTemp.startsWith("..") && !path.isAbsolute(relativeToTemp))) {
      errors.push("DATABASE_PATH geçici sistem dizini altında olamaz.");
    }
    const relativeToApp = path.relative(path.resolve(cwd), databasePath);
    if (relativeToApp === "" || (!relativeToApp.startsWith("..") && !path.isAbsolute(relativeToApp))) {
      warnings.push("DATABASE_PATH uygulama dizini altında; dağıtımda kalıcı volume kullandığından emin ol.");
    }
  }

  const backupValue = environment.BACKUP_DIR?.trim() || "";
  const backupDirectory = backupValue
    ? path.normalize(backupValue)
    : databasePath
      ? path.join(path.dirname(databasePath), "backups")
      : "";
  if (backupValue && !path.isAbsolute(backupValue)) {
    errors.push("BACKUP_DIR mutlak bir yol olmalıdır.");
  }
  if (databasePath && backupDirectory === databasePath) {
    errors.push("BACKUP_DIR veritabanı dosyasıyla aynı yol olamaz.");
  }
  if (backupDirectory) {
    const relativeToTemp = path.relative(path.resolve(os.tmpdir()), backupDirectory);
    if (relativeToTemp === "" || (!relativeToTemp.startsWith("..") && !path.isAbsolute(relativeToTemp))) {
      errors.push("BACKUP_DIR geçici sistem dizini altında olamaz.");
    }
  }

  const allowDemoMode = parseBoolean(
    environment.ALLOW_DEMO_MODE,
    "ALLOW_DEMO_MODE",
    errors,
  );
  if (!environment.OPENAI_API_KEY?.trim() && !allowDemoMode) {
    errors.push("OPENAI_API_KEY zorunludur; yalnızca bilinçli demo için ALLOW_DEMO_MODE=true kullan.");
  }
  if (environment.NEXT_PUBLIC_OPENAI_API_KEY?.trim()) {
    errors.push("NEXT_PUBLIC_OPENAI_API_KEY kullanılamaz; API anahtarı tarayıcıya açılmamalıdır.");
  }

  const emailDeliveryMode = (environment.EMAIL_DELIVERY_MODE?.trim() || "resend").toLowerCase();
  if (!["log", "resend"].includes(emailDeliveryMode)) {
    errors.push("EMAIL_DELIVERY_MODE yalnızca resend veya log olabilir.");
  }
  if (emailDeliveryMode === "log" && !allowDemoMode) {
    errors.push("Canlı ortamda EMAIL_DELIVERY_MODE=log yalnızca ALLOW_DEMO_MODE=true ile kullanılabilir.");
  }
  if (emailDeliveryMode === "resend") {
    if (!environment.RESEND_API_KEY?.trim()) {
      errors.push("RESEND_API_KEY şifre sıfırlama e-postaları için zorunludur.");
    }
    const sender = environment.EMAIL_FROM?.trim() || "";
    const angleAddress = sender.match(/<([^<>]+)>$/)?.[1];
    const senderAddress = angleAddress || sender;
    if (
      !sender || sender.length > 320 || /[\r\n]/.test(sender) ||
      !/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(senderAddress)
    ) {
      errors.push("EMAIL_FROM geçerli bir gönderici e-posta adresi olmalıdır.");
    }
  }
  if (environment.NEXT_PUBLIC_RESEND_API_KEY?.trim()) {
    errors.push("NEXT_PUBLIC_RESEND_API_KEY kullanılamaz; e-posta anahtarı tarayıcıya açılmamalıdır.");
  }

  const legalEntityName = environment.LEGAL_ENTITY_NAME?.trim() || "";
  if (
    legalEntityName.length < 2 ||
    legalEntityName.length > 160 ||
    /[\r\n]/.test(legalEntityName)
  ) {
    errors.push("LEGAL_ENTITY_NAME veri sorumlusunun 2-160 karakterlik yasal adı/unvanı olmalıdır.");
  }

  const legalContactEmail = environment.LEGAL_CONTACT_EMAIL?.trim() || "";
  if (
    legalContactEmail.length > 254 ||
    /[\r\n]/.test(legalContactEmail) ||
    !/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(legalContactEmail)
  ) {
    errors.push("LEGAL_CONTACT_EMAIL geçerli ve izlenen bir iletişim e-posta adresi olmalıdır.");
  }

  const legalAddress = environment.LEGAL_ADDRESS?.trim() || "";
  if (
    legalAddress.length < 10 ||
    legalAddress.length > 500 ||
    /[\r\n]/.test(legalAddress)
  ) {
    errors.push("LEGAL_ADDRESS veri sorumlusunun 10-500 karakterlik tebligat adresi olmalıdır.");
  }

  const backupRetentionDays = parseInteger(
    environment.BACKUP_RETENTION_DAYS,
    "BACKUP_RETENTION_DAYS",
    14,
    1,
    365,
    errors,
  );
  const backupMaxFiles = parseInteger(
    environment.BACKUP_MAX_FILES,
    "BACKUP_MAX_FILES",
    30,
    2,
    365,
    errors,
  );
  const backupIntervalHours = parseInteger(
    environment.BACKUP_INTERVAL_HOURS,
    "BACKUP_INTERVAL_HOURS",
    24,
    1,
    168,
    errors,
  );

  return {
    errors,
    warnings,
    config: {
      appOrigin,
      databasePath,
      backupDirectory,
      backupRetentionDays,
      backupMaxFiles,
      backupIntervalHours,
      allowDemoMode,
      emailDeliveryMode,
      legalEntityName,
      legalContactEmail,
      legalAddress,
    },
  };
}

function assertProductionEnv(environment = process.env, options = {}) {
  const result = validateProductionEnv(environment, options);
  if (result.errors.length > 0) {
    throw new Error(`Canlı ortam yapılandırması geçersiz:\n- ${result.errors.join("\n- ")}`);
  }
  return result;
}

if (require.main === module) {
  loadNextEnvironment();
  const result = validateProductionEnv(process.env);
  for (const warning of result.warnings) console.warn(`Uyarı: ${warning}`);
  if (result.errors.length > 0) {
    console.error(`Canlı ortam başlatılamadı:\n- ${result.errors.join("\n- ")}`);
    process.exitCode = 1;
  } else {
    console.log("Canlı ortam yapılandırması doğrulandı.");
  }
}

module.exports = {
  assertProductionEnv,
  loadNextEnvironment,
  validateProductionEnv,
};

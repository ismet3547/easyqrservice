import { createHash } from "node:crypto";
import { isIP } from "node:net";
import { db } from "@/lib/db";

type RateLimitRow = {
  attempts: number;
  reset_at: number;
};

const cleanupIntervalMs = 60 * 1000;
const maximumStoredWindows = 10_000;
let nextCleanupAt = 0;

function hashKey(key: string) {
  return createHash("sha256").update(key).digest("hex");
}

function cleanupRateLimits(now: number) {
  if (now < nextCleanupAt) return;
  nextCleanupAt = now + cleanupIntervalMs;

  db.prepare("DELETE FROM rate_limits WHERE reset_at <= ?").run(now);
}

const updateWindow = db.transaction(
  (keyHash: string, limit: number, windowMs: number, now: number) => {
    const current = db.prepare(
      "SELECT attempts, reset_at FROM rate_limits WHERE key_hash = ?",
    ).get(keyHash) as RateLimitRow | undefined;

    if (!current) {
      const count = (
        db.prepare("SELECT COUNT(*) AS count FROM rate_limits").get() as { count: number }
      ).count;
      if (count >= maximumStoredWindows) {
        return { allowed: false, retryAfterSeconds: 60 };
      }

      db.prepare(
        "INSERT INTO rate_limits (key_hash, attempts, reset_at) VALUES (?, 1, ?)",
      ).run(keyHash, now + windowMs);
      return { allowed: true, retryAfterSeconds: 0 };
    }

    if (current.reset_at <= now) {
      db.prepare(
        "UPDATE rate_limits SET attempts = 1, reset_at = ? WHERE key_hash = ?",
      ).run(now + windowMs, keyHash);
      return { allowed: true, retryAfterSeconds: 0 };
    }

    const attempts = current.attempts + 1;
    db.prepare("UPDATE rate_limits SET attempts = ? WHERE key_hash = ?")
      .run(attempts, keyHash);

    return {
      allowed: attempts <= limit,
      retryAfterSeconds: attempts <= limit
        ? 0
        : Math.max(1, Math.ceil((current.reset_at - now) / 1000)),
    };
  },
);

export function checkRateLimit(key: string, limit: number, windowMs: number) {
  if (
    !Number.isSafeInteger(limit) ||
    limit <= 0 ||
    !Number.isSafeInteger(windowMs) ||
    windowMs <= 0
  ) {
    throw new RangeError("Rate-limit values must be positive safe integers.");
  }

  const now = Date.now();
  cleanupRateLimits(now);
  return updateWindow(hashKey(key), limit, windowMs, now);
}

function normalizeAddress(value: string | null) {
  if (!value) return null;
  const candidate = value.trim().replace(/^\[|\]$/g, "");
  return candidate.length <= 80 && isIP(candidate) ? candidate : null;
}

type HeaderReader = Pick<Headers, "get">;

export function getClientAddressFromHeaders(headers: HeaderReader) {
  // Trust exactly one explicitly configured header. The ingress must overwrite
  // it with a single verified address and prevent direct access to this server.
  const header = process.env.CLIENT_IP_HEADER?.trim().toLowerCase();
  if (!header || !["cf-connecting-ip", "x-forwarded-for", "x-real-ip"].includes(header)) {
    return "unknown";
  }
  return normalizeAddress(headers.get(header)) || "unknown";
}

export function getClientAddress(request: Request) {
  return getClientAddressFromHeaders(request.headers);
}

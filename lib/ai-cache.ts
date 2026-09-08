import { createHash } from "node:crypto";
import { db } from "@/lib/db";

type AiCacheKeyOptions = {
  userId: string;
  operation: string;
  version: string;
  model: string;
  input: string;
};

type AiCacheWriteOptions<T> = {
  userId: string;
  cacheKey: string;
  operation: string;
  value: T;
  ttlMs: number;
  maxEntries: number;
  maxOperationBytes: number;
  maxPayloadBytes: number;
};

type AiCacheRow = {
  payload_json: string;
  expires_at: string;
};

type AiCacheFootprintRow = {
  cache_key: string;
  payload_bytes: number;
};

export function createAiCacheKey({ userId, operation, version, model, input }: AiCacheKeyOptions) {
  const hash = createHash("sha256");
  hash.update(userId);
  hash.update("\0");
  hash.update(operation);
  hash.update("\0");
  hash.update(version);
  hash.update("\0");
  hash.update(model);
  hash.update("\0");
  hash.update(input);
  return hash.digest("hex");
}

export function deleteAiCacheEntry(userId: string, cacheKey: string) {
  db.prepare("DELETE FROM ai_cache WHERE user_id = ? AND cache_key = ?").run(userId, cacheKey);
}

export function readAiCache<T>(userId: string, cacheKey: string, operation: string): T | null {
  const now = new Date().toISOString();
  const row = db.prepare(
    `SELECT payload_json, expires_at
     FROM ai_cache
     WHERE user_id = ? AND cache_key = ? AND operation = ?`,
  ).get(userId, cacheKey, operation) as AiCacheRow | undefined;

  if (!row) return null;
  if (row.expires_at <= now) {
    deleteAiCacheEntry(userId, cacheKey);
    return null;
  }

  try {
    const value = JSON.parse(row.payload_json) as T;
    db.prepare(
      `UPDATE ai_cache
       SET hit_count = hit_count + 1, last_accessed_at = ?
       WHERE user_id = ? AND cache_key = ?`,
    ).run(now, userId, cacheKey);
    return value;
  } catch {
    deleteAiCacheEntry(userId, cacheKey);
    return null;
  }
}

function pruneAiCache(
  userId: string,
  operation: string,
  maxEntries: number,
  maxOperationBytes: number,
) {
  const now = new Date().toISOString();
  db.prepare("DELETE FROM ai_cache WHERE expires_at <= ?").run(now);

  const rows = db.prepare(
    `SELECT cache_key, payload_bytes
     FROM ai_cache
     WHERE user_id = ? AND operation = ?
     ORDER BY last_accessed_at DESC, created_at DESC`,
  ).all(userId, operation) as AiCacheFootprintRow[];

  let keptEntries = 0;
  let keptBytes = 0;
  const keysToDelete: string[] = [];
  for (const row of rows) {
    const fitsEntryLimit = keptEntries < maxEntries;
    const fitsByteLimit = keptBytes + row.payload_bytes <= maxOperationBytes;
    if (fitsEntryLimit && fitsByteLimit) {
      keptEntries += 1;
      keptBytes += row.payload_bytes;
    } else {
      keysToDelete.push(row.cache_key);
    }
  }

  if (keysToDelete.length === 0) return;
  const removeEntry = db.prepare("DELETE FROM ai_cache WHERE user_id = ? AND cache_key = ?");
  db.transaction((cacheKeys: string[]) => {
    cacheKeys.forEach((cacheKey) => removeEntry.run(userId, cacheKey));
  })(keysToDelete);
}

export function writeAiCache<T>({
  userId,
  cacheKey,
  operation,
  value,
  ttlMs,
  maxEntries,
  maxOperationBytes,
  maxPayloadBytes,
}: AiCacheWriteOptions<T>) {
  let payload: string;
  try {
    payload = JSON.stringify(value);
  } catch {
    return false;
  }

  const payloadBytes = Buffer.byteLength(payload, "utf8");
  if (payloadBytes > maxPayloadBytes || payloadBytes > maxOperationBytes) return false;

  const now = new Date();
  const nowIso = now.toISOString();
  const expiresAt = new Date(now.getTime() + ttlMs).toISOString();
  db.prepare(
    `INSERT INTO ai_cache
      (cache_key, user_id, operation, payload_json, payload_bytes, hit_count, created_at, last_accessed_at, expires_at)
     VALUES (?, ?, ?, ?, ?, 0, ?, ?, ?)
     ON CONFLICT(cache_key) DO UPDATE SET
       user_id = excluded.user_id,
       operation = excluded.operation,
       payload_json = excluded.payload_json,
       payload_bytes = excluded.payload_bytes,
       created_at = excluded.created_at,
       last_accessed_at = excluded.last_accessed_at,
       expires_at = excluded.expires_at`,
  ).run(
    cacheKey,
    userId,
    operation,
    payload,
    payloadBytes,
    nowIso,
    nowIso,
    expiresAt,
  );

  pruneAiCache(userId, operation, maxEntries, maxOperationBytes);
  return true;
}

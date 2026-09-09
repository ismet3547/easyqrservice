import { createHash, randomBytes, randomUUID } from "node:crypto";
import { db } from "@/lib/db";

export const passwordResetTokenDurationMs = 30 * 60 * 1000;
export const passwordResetTokenPattern = /^[A-Za-z0-9_-]{43}$/;

type PasswordResetRow = {
  user_id: string;
};

export function hashPasswordResetToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function isValidPasswordResetToken(token: string) {
  return passwordResetTokenPattern.test(token);
}

export function createPasswordResetToken(userId: string, now = new Date()) {
  const token = randomBytes(32).toString("base64url");
  const tokenHash = hashPasswordResetToken(token);
  const expiresAt = new Date(now.getTime() + passwordResetTokenDurationMs).toISOString();

  db.transaction(() => {
    db.prepare("DELETE FROM password_reset_tokens WHERE expires_at <= ?")
      .run(now.toISOString());
    db.prepare("DELETE FROM password_reset_tokens WHERE user_id = ?").run(userId);
    db.prepare(
      `INSERT INTO password_reset_tokens
        (id, user_id, token_hash, expires_at, created_at)
       VALUES (?, ?, ?, ?, ?)`,
    ).run(randomUUID(), userId, tokenHash, expiresAt, now.toISOString());
  })();

  return { token, expiresAt };
}

export function revokePasswordResetToken(token: string) {
  if (!isValidPasswordResetToken(token)) return;
  db.prepare("DELETE FROM password_reset_tokens WHERE token_hash = ?")
    .run(hashPasswordResetToken(token));
}

export function resetPasswordWithToken(
  token: string,
  passwordHash: string,
  now = new Date(),
) {
  if (!isValidPasswordResetToken(token)) return false;

  return db.transaction(() => {
    const row = db.prepare(
      `SELECT user_id
       FROM password_reset_tokens
       WHERE token_hash = ? AND expires_at > ?`,
    ).get(hashPasswordResetToken(token), now.toISOString()) as PasswordResetRow | undefined;

    if (!row) {
      db.prepare("DELETE FROM password_reset_tokens WHERE expires_at <= ?")
        .run(now.toISOString());
      return false;
    }

    const updated = db.prepare(
      "UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?",
    ).run(passwordHash, now.toISOString(), row.user_id);
    if (updated.changes !== 1) return false;

    db.prepare("DELETE FROM sessions WHERE user_id = ?").run(row.user_id);
    db.prepare("DELETE FROM password_reset_tokens WHERE user_id = ?").run(row.user_id);
    return true;
  })();
}

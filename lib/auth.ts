import { cookies } from "next/headers";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import { db } from "@/lib/db";

const sessionCookieName = "easyqr_session";
const rememberedSessionDurationMs = 30 * 24 * 60 * 60 * 1000;
const standardSessionDurationMs = 24 * 60 * 60 * 1000;

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  createdAt: string;
};

type UserRow = {
  id: string;
  name: string;
  email: string;
  created_at: string;
};

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function toSessionUser(row: UserRow): SessionUser {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    createdAt: row.created_at,
  };
}

function removeExpiredSessions() {
  db.prepare("DELETE FROM sessions WHERE expires_at <= ?").run(new Date().toISOString());
}

export async function createSession(userId: string, remember = true) {
  removeExpiredSessions();

  const token = randomBytes(32).toString("base64url");
  const now = new Date();
  const expiresAt = new Date(
    now.getTime() + (remember ? rememberedSessionDurationMs : standardSessionDurationMs),
  );

  db.prepare(
    "INSERT INTO sessions (id, user_id, token_hash, expires_at, created_at) VALUES (?, ?, ?, ?, ?)",
  ).run(randomUUID(), userId, hashToken(token), expiresAt.toISOString(), now.toISOString());

  const cookieStore = await cookies();
  cookieStore.set(sessionCookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(sessionCookieName)?.value;
  if (!token) return null;

  const row = db
    .prepare(
      `SELECT users.id, users.name, users.email, users.created_at
       FROM sessions
       JOIN users ON users.id = sessions.user_id
       WHERE sessions.token_hash = ? AND sessions.expires_at > ?`,
    )
    .get(hashToken(token), new Date().toISOString()) as UserRow | undefined;

  if (!row) {
    cookieStore.delete(sessionCookieName);
    return null;
  }

  return toSessionUser(row);
}

export async function deleteCurrentSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(sessionCookieName)?.value;
  if (token) {
    db.prepare("DELETE FROM sessions WHERE token_hash = ?").run(hashToken(token));
  }
  cookieStore.delete(sessionCookieName);
}

export function isSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return process.env.NODE_ENV !== "production";

  const expectedHost = request.headers.get("x-forwarded-host") || request.headers.get("host");
  const expectedProtocol = request.headers.get("x-forwarded-proto") || new URL(request.url).protocol.slice(0, -1);
  try {
    const parsedOrigin = new URL(origin);
    return parsedOrigin.host === expectedHost && parsedOrigin.protocol === `${expectedProtocol}:`;
  } catch {
    return false;
  }
}

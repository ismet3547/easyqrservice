import { cookies } from "next/headers";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import { getAccountAccess, type AccountAccess } from "@/lib/account-plan";
import { db } from "@/lib/db";

const sessionCookieName = "easyqr_session";
const rememberedSessionDurationMs = 30 * 24 * 60 * 60 * 1000;
const standardSessionDurationMs = 24 * 60 * 60 * 1000;
const loopbackHostnames = new Set(["localhost", "127.0.0.1", "[::1]"]);

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  account: AccountAccess;
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
    account: getAccountAccess(row.id),
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
    priority: "high",
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

  // Reading cookies is allowed during Server Component rendering, but mutating
  // them is not. Route handlers clear cookies explicitly when signing out.
  if (!row) return null;

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

function configuredRequestOrigins() {
  const origins = new Set<string>();
  const configuredAppUrl = process.env.APP_URL?.trim();
  if (configuredAppUrl) {
    try {
      origins.add(new URL(configuredAppUrl).origin);
    } catch {
      // Production startup validation reports malformed configuration.
    }
  }

  for (const value of (process.env.LOCAL_PREVIEW_ORIGINS || "").split(",")) {
    const candidate = value.trim();
    if (!candidate) continue;
    try {
      const parsed = new URL(candidate);
      const isOriginOnly = (
        !parsed.username && !parsed.password && parsed.pathname === "/" &&
        !parsed.search && !parsed.hash
      );
      if (
        isOriginOnly &&
        loopbackHostnames.has(parsed.hostname) &&
        ["http:", "https:"].includes(parsed.protocol)
      ) {
        origins.add(parsed.origin);
      }
    } catch {
      // Ignore invalid runtime entries instead of weakening origin checks.
    }
  }
  return origins;
}

export function isSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return process.env.NODE_ENV !== "production";

  try {
    const parsedOrigin = new URL(origin);
    const allowedOrigins = configuredRequestOrigins();
    if (allowedOrigins.size > 0) {
      return allowedOrigins.has(parsedOrigin.origin);
    }

    const expectedHost = (
      request.headers.get("x-forwarded-host") || request.headers.get("host")
    )?.split(",")[0]?.trim();
    const expectedProtocol = (
      request.headers.get("x-forwarded-proto") || new URL(request.url).protocol.slice(0, -1)
    ).split(",")[0]?.trim();
    return Boolean(
      expectedHost &&
      expectedProtocol &&
      parsedOrigin.host === expectedHost &&
      parsedOrigin.protocol === `${expectedProtocol}:`,
    );
  } catch {
    return false;
  }
}

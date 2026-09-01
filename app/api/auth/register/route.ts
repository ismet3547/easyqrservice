import bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { createSession, isSameOrigin } from "@/lib/auth";
import { db } from "@/lib/db";
import { checkRateLimit, getClientAddress } from "@/lib/rate-limit";

export const runtime = "nodejs";

type RegisterBody = {
  name?: string;
  email?: string;
  password?: string;
};

function normalizeEmail(value: string) {
  return value.trim().toLocaleLowerCase("en-US");
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 254;
}

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ message: "Geçersiz istek kaynağı." }, { status: 403 });
  }

  const rateLimit = checkRateLimit(`register:${getClientAddress(request)}`, 5, 15 * 60 * 1000);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { message: "Çok fazla kayıt denemesi yapıldı. Biraz sonra tekrar dene." },
      { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } },
    );
  }

  let body: RegisterBody;
  try {
    body = (await request.json()) as RegisterBody;
  } catch {
    return NextResponse.json({ message: "Geçersiz istek." }, { status: 400 });
  }

  const name = body.name?.trim() || "";
  const email = normalizeEmail(body.email || "");
  const password = body.password || "";

  if (name.length < 2 || name.length > 60) {
    return NextResponse.json({ message: "Adın 2–60 karakter arasında olmalı." }, { status: 400 });
  }
  if (!isValidEmail(email)) {
    return NextResponse.json({ message: "Geçerli bir e-posta adresi gir." }, { status: 400 });
  }
  if (password.length < 8 || Buffer.byteLength(password, "utf8") > 72) {
    return NextResponse.json(
      { message: "Şifren 8–72 karakter arasında olmalı." },
      { status: 400 },
    );
  }

  const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(email);
  if (existing) {
    return NextResponse.json(
      { message: "Bu e-posta adresiyle zaten bir hesap bulunuyor." },
      { status: 409 },
    );
  }

  const id = randomUUID();
  const now = new Date().toISOString();
  const passwordHash = await bcrypt.hash(password, 12);

  try {
    db.prepare(
      "INSERT INTO users (id, name, email, password_hash, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
    ).run(id, name, email, passwordHash, now, now);
  } catch (error) {
    const databaseError = error as { code?: string };
    if (databaseError.code === "SQLITE_CONSTRAINT_UNIQUE") {
      return NextResponse.json(
        { message: "Bu e-posta adresiyle zaten bir hesap bulunuyor." },
        { status: 409 },
      );
    }
    throw error;
  }

  await createSession(id);
  return NextResponse.json(
    { user: { id, name, email, createdAt: now } },
    { status: 201, headers: { "Cache-Control": "no-store" } },
  );
}

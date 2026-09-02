import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { getCurrentUser, isSameOrigin } from "@/lib/auth";
import { db } from "@/lib/db";
import { checkRateLimit, getClientAddress } from "@/lib/rate-limit";

export const runtime = "nodejs";

type ProfileBody = {
  currentPassword?: string;
  email?: string;
  name?: string;
};

type AccountRow = {
  password_hash: string;
};

function normalizeEmail(value: string) {
  return value.trim().toLocaleLowerCase("en-US");
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 254;
}

export async function GET() {
  const user = await getCurrentUser();
  return NextResponse.json({ user }, { headers: { "Cache-Control": "no-store" } });
}

export async function PATCH(request: Request) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ message: "Geçersiz istek kaynağı." }, { status: 403 });
  }

  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Giriş gerekli." }, { status: 401 });

  const rateLimit = checkRateLimit(
    `profile-update:${user.id}:${getClientAddress(request)}`,
    20,
    60 * 60 * 1000,
  );
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { message: "Çok fazla profil güncelleme isteği yapıldı. Biraz sonra tekrar dene." },
      { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } },
    );
  }

  const body = (await request.json().catch(() => null)) as ProfileBody | null;
  if (!body) return NextResponse.json({ message: "Geçersiz istek." }, { status: 400 });

  const name = (body.name || "").trim();
  const email = normalizeEmail(body.email || "");
  if (name.length < 2 || name.length > 60) {
    return NextResponse.json({ message: "Adın 2–60 karakter arasında olmalı." }, { status: 400 });
  }
  if (!isValidEmail(email)) {
    return NextResponse.json({ message: "Geçerli bir e-posta adresi gir." }, { status: 400 });
  }

  const emailChanged = email !== user.email.toLocaleLowerCase("en-US");
  if (emailChanged) {
    const currentPassword = body.currentPassword || "";
    if (!currentPassword || Buffer.byteLength(currentPassword, "utf8") > 72) {
      return NextResponse.json(
        { message: "E-posta adresini değiştirmek için mevcut şifreni gir." },
        { status: 400 },
      );
    }

    const passwordRateLimit = checkRateLimit(
      `profile-password:${user.id}:${getClientAddress(request)}`,
      6,
      15 * 60 * 1000,
    );
    if (!passwordRateLimit.allowed) {
      return NextResponse.json(
        { message: "Çok fazla şifre denemesi yapıldı. Biraz sonra tekrar dene." },
        { status: 429, headers: { "Retry-After": String(passwordRateLimit.retryAfterSeconds) } },
      );
    }

    const account = db
      .prepare("SELECT password_hash FROM users WHERE id = ?")
      .get(user.id) as AccountRow | undefined;
    const passwordMatches = account
      ? await bcrypt.compare(currentPassword, account.password_hash)
      : false;
    if (!passwordMatches) {
      return NextResponse.json({ message: "Mevcut şifren hatalı." }, { status: 401 });
    }
  }

  const duplicate = db
    .prepare("SELECT id FROM users WHERE email = ? AND id <> ?")
    .get(email, user.id);
  if (duplicate) {
    return NextResponse.json(
      { message: "Bu e-posta adresi başka bir hesap tarafından kullanılıyor." },
      { status: 409 },
    );
  }

  const now = new Date().toISOString();
  try {
    db.prepare("UPDATE users SET name = ?, email = ?, updated_at = ? WHERE id = ?")
      .run(name, email, now, user.id);
  } catch (error) {
    const databaseError = error as { code?: string };
    if (databaseError.code === "SQLITE_CONSTRAINT_UNIQUE") {
      return NextResponse.json(
        { message: "Bu e-posta adresi başka bir hesap tarafından kullanılıyor." },
        { status: 409 },
      );
    }
    throw error;
  }

  return NextResponse.json(
    {
      message: "Hesap bilgilerin güncellendi.",
      user: { ...user, name, email },
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}

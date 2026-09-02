import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { createSession, getCurrentUser, isSameOrigin } from "@/lib/auth";
import { db } from "@/lib/db";
import { checkRateLimit, getClientAddress } from "@/lib/rate-limit";

export const runtime = "nodejs";

type PasswordBody = {
  currentPassword?: string;
  newPassword?: string;
};

type PasswordRow = {
  password_hash: string;
};

export async function PATCH(request: Request) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ message: "Geçersiz istek kaynağı." }, { status: 403 });
  }

  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Giriş gerekli." }, { status: 401 });

  const rateLimit = checkRateLimit(
    `password-change:${user.id}:${getClientAddress(request)}`,
    6,
    15 * 60 * 1000,
  );
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { message: "Çok fazla şifre değiştirme denemesi yapıldı. Biraz sonra tekrar dene." },
      { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } },
    );
  }

  const body = (await request.json().catch(() => null)) as PasswordBody | null;
  if (!body) return NextResponse.json({ message: "Geçersiz istek." }, { status: 400 });

  const currentPassword = body.currentPassword || "";
  const newPassword = body.newPassword || "";
  if (!currentPassword || Buffer.byteLength(currentPassword, "utf8") > 72) {
    return NextResponse.json({ message: "Mevcut şifreni gir." }, { status: 400 });
  }
  if (newPassword.length < 8 || Buffer.byteLength(newPassword, "utf8") > 72) {
    return NextResponse.json(
      { message: "Yeni şifren 8–72 karakter arasında olmalı." },
      { status: 400 },
    );
  }
  if (newPassword === currentPassword) {
    return NextResponse.json(
      { message: "Yeni şifren mevcut şifrenden farklı olmalı." },
      { status: 400 },
    );
  }

  const account = db
    .prepare("SELECT password_hash FROM users WHERE id = ?")
    .get(user.id) as PasswordRow | undefined;
  const passwordMatches = account
    ? await bcrypt.compare(currentPassword, account.password_hash)
    : false;
  if (!passwordMatches) {
    return NextResponse.json({ message: "Mevcut şifren hatalı." }, { status: 401 });
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);
  const now = new Date().toISOString();
  db.transaction(() => {
    db.prepare("UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?")
      .run(passwordHash, now, user.id);
    db.prepare("DELETE FROM sessions WHERE user_id = ?").run(user.id);
  })();

  await createSession(user.id);
  return NextResponse.json(
    { message: "Şifren değiştirildi. Diğer cihazlardaki oturumlar kapatıldı." },
    { headers: { "Cache-Control": "no-store" } },
  );
}

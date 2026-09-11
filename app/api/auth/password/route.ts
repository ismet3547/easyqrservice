import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { createSession, getCurrentUser, isSameOrigin } from "@/lib/auth";
import { db } from "@/lib/db";
import { isRecordWithOnlyKeys, readJsonRequest } from "@/lib/http";
import { checkRateLimit } from "@/lib/rate-limit";
import { changePasswordWithCurrentHash } from "@/lib/password-reset";

export const runtime = "nodejs";

const maximumRequestBytes = 4 * 1024;

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
    `password-change:${user.id}`,
    6,
    15 * 60 * 1000,
  );
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { message: "Çok fazla şifre değiştirme denemesi yapıldı. Biraz sonra tekrar dene." },
      { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } },
    );
  }

  const parsed = await readJsonRequest(request, maximumRequestBytes);
  if (!parsed.ok) {
    return NextResponse.json(
      { message: parsed.reason === "too-large" ? "İstek çok büyük." : "Geçersiz istek." },
      { status: parsed.status },
    );
  }
  if (
    !isRecordWithOnlyKeys(parsed.value, ["currentPassword", "newPassword"]) ||
    typeof parsed.value.currentPassword !== "string" ||
    typeof parsed.value.newPassword !== "string"
  ) {
    return NextResponse.json({ message: "Geçersiz istek." }, { status: 400 });
  }
  const body = parsed.value as PasswordBody;

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
  if (!account || !changePasswordWithCurrentHash(user.id, account.password_hash, passwordHash)) {
    return NextResponse.json(
      { message: "Şifren başka bir işlemde değişti. Yeniden giriş yap." },
      { status: 409 },
    );
  }

  await createSession(user.id);
  return NextResponse.json(
    { message: "Şifren değiştirildi. Diğer cihazlardaki oturumlar kapatıldı." },
    { headers: { "Cache-Control": "no-store" } },
  );
}

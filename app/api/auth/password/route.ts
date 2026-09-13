import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { createSession, getCurrentUser, isSameOrigin } from "@/lib/auth";
import { db } from "@/lib/db";
import { isRecordWithOnlyKeys, readJsonRequest } from "@/lib/http";
import { checkRateLimit } from "@/lib/rate-limit";
import { changePasswordWithCurrentHash } from "@/lib/password-reset";
import { resolveRequestLocale } from "@/lib/i18n";

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
  const locale = resolveRequestLocale(request);
  const t = (english: string, turkish: string) => locale === "tr" ? turkish : english;
  if (!isSameOrigin(request)) {
    return NextResponse.json({ message: t("Invalid request origin.", "Geçersiz istek kaynağı.") }, { status: 403 });
  }

  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: t("Login required.", "Giriş gerekli.") }, { status: 401 });

  const rateLimit = checkRateLimit(
    `password-change:${user.id}`,
    6,
    15 * 60 * 1000,
  );
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { message: t("Too many password change attempts. Please try again later.", "Çok fazla şifre değiştirme denemesi yapıldı. Biraz sonra tekrar dene.") },
      { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } },
    );
  }

  const parsed = await readJsonRequest(request, maximumRequestBytes);
  if (!parsed.ok) {
    return NextResponse.json(
      { message: parsed.reason === "too-large" ? t("Request is too large.", "İstek çok büyük.") : t("Invalid request.", "Geçersiz istek.") },
      { status: parsed.status },
    );
  }
  if (
    !isRecordWithOnlyKeys(parsed.value, ["currentPassword", "newPassword"]) ||
    typeof parsed.value.currentPassword !== "string" ||
    typeof parsed.value.newPassword !== "string"
  ) {
    return NextResponse.json({ message: t("Invalid request.", "Geçersiz istek.") }, { status: 400 });
  }
  const body = parsed.value as PasswordBody;

  const currentPassword = body.currentPassword || "";
  const newPassword = body.newPassword || "";
  if (!currentPassword || Buffer.byteLength(currentPassword, "utf8") > 72) {
    return NextResponse.json({ message: t("Enter your current password.", "Mevcut şifreni gir.") }, { status: 400 });
  }
  if (newPassword.length < 8 || Buffer.byteLength(newPassword, "utf8") > 72) {
    return NextResponse.json(
      { message: t("Your new password must be between 8 and 72 characters.", "Yeni şifren 8–72 karakter arasında olmalı.") },
      { status: 400 },
    );
  }
  if (newPassword === currentPassword) {
    return NextResponse.json(
      { message: t("Your new password must be different from your current password.", "Yeni şifren mevcut şifrenden farklı olmalı.") },
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
    return NextResponse.json({ message: t("Your current password is incorrect.", "Mevcut şifren hatalı.") }, { status: 401 });
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);
  if (!account || !changePasswordWithCurrentHash(user.id, account.password_hash, passwordHash)) {
    return NextResponse.json(
      { message: t("Your password changed in another session. Log in again.", "Şifren başka bir işlemde değişti. Yeniden giriş yap.") },
      { status: 409 },
    );
  }

  await createSession(user.id);
  return NextResponse.json(
    { message: t("Your password was changed. Sessions on other devices were closed.", "Şifren değiştirildi. Diğer cihazlardaki oturumlar kapatıldı.") },
    { headers: { "Cache-Control": "no-store" } },
  );
}

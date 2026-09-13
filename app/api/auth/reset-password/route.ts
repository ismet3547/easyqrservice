import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { isSameOrigin } from "@/lib/auth";
import {
  hashPasswordResetToken,
  isValidPasswordResetToken,
  resetPasswordWithToken,
} from "@/lib/password-reset";
import { isRecordWithOnlyKeys, readJsonRequest } from "@/lib/http";
import { checkRateLimit, getClientAddress } from "@/lib/rate-limit";
import { resolveRequestLocale } from "@/lib/i18n";

export const runtime = "nodejs";

const maximumRequestBytes = 4 * 1024;

type ResetPasswordBody = {
  password?: unknown;
  token?: unknown;
};

export async function POST(request: Request) {
  const locale = resolveRequestLocale(request);
  const t = (english: string, turkish: string) => locale === "tr" ? turkish : english;
  if (!isSameOrigin(request)) {
    return NextResponse.json({ message: t("Invalid request origin.", "Geçersiz istek kaynağı.") }, { status: 403 });
  }

  const rateLimit = checkRateLimit(
    `reset-password:ip:${getClientAddress(request)}`,
    10,
    15 * 60 * 1000,
  );
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { message: t("Too many attempts. Please try again later.", "Çok fazla deneme yapıldı. Biraz sonra tekrar dene.") },
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
  if (!isRecordWithOnlyKeys(parsed.value, ["password", "token"])) {
    return NextResponse.json({ message: t("Invalid request.", "Geçersiz istek.") }, { status: 400 });
  }
  const body = parsed.value as ResetPasswordBody;

  const token = typeof body.token === "string" ? body.token : "";
  const password = typeof body.password === "string" ? body.password : "";
  if (!isValidPasswordResetToken(token)) {
    return NextResponse.json(
      { message: t("The password reset link is invalid or has expired.", "Şifre yenileme bağlantısı geçersiz veya süresi dolmuş.") },
      { status: 400 },
    );
  }
  if (password.length < 8 || Buffer.byteLength(password, "utf8") > 72) {
    return NextResponse.json(
      { message: t("Your new password must be between 8 and 72 characters.", "Yeni şifren 8–72 karakter arasında olmalı.") },
      { status: 400 },
    );
  }

  const tokenLimit = checkRateLimit(
    `reset-password:token:${hashPasswordResetToken(token)}`,
    5,
    15 * 60 * 1000,
  );
  if (!tokenLimit.allowed) {
    return NextResponse.json(
      { message: t("Too many attempts. Request a new link.", "Çok fazla deneme yapıldı. Yeni bir bağlantı iste.") },
      { status: 429, headers: { "Retry-After": String(tokenLimit.retryAfterSeconds) } },
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const reset = resetPasswordWithToken(token, passwordHash);
  if (!reset) {
    return NextResponse.json(
      { message: t("The password reset link is invalid or has expired.", "Şifre yenileme bağlantısı geçersiz veya süresi dolmuş.") },
      { status: 400 },
    );
  }

  return NextResponse.json(
    { message: t("Your password has been reset. You can now log in with your new password.", "Şifren yenilendi. Şimdi yeni şifrenle giriş yapabilirsin.") },
    { headers: { "Cache-Control": "no-store" } },
  );
}

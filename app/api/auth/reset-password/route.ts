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

export const runtime = "nodejs";

const maximumRequestBytes = 4 * 1024;

type ResetPasswordBody = {
  password?: unknown;
  token?: unknown;
};

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ message: "Geçersiz istek kaynağı." }, { status: 403 });
  }

  const rateLimit = checkRateLimit(
    `reset-password:ip:${getClientAddress(request)}`,
    10,
    15 * 60 * 1000,
  );
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { message: "Çok fazla deneme yapıldı. Biraz sonra tekrar dene." },
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
  if (!isRecordWithOnlyKeys(parsed.value, ["password", "token"])) {
    return NextResponse.json({ message: "Geçersiz istek." }, { status: 400 });
  }
  const body = parsed.value as ResetPasswordBody;

  const token = typeof body.token === "string" ? body.token : "";
  const password = typeof body.password === "string" ? body.password : "";
  if (!isValidPasswordResetToken(token)) {
    return NextResponse.json(
      { message: "Şifre yenileme bağlantısı geçersiz veya süresi dolmuş." },
      { status: 400 },
    );
  }
  if (password.length < 8 || Buffer.byteLength(password, "utf8") > 72) {
    return NextResponse.json(
      { message: "Yeni şifren 8–72 karakter arasında olmalı." },
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
      { message: "Çok fazla deneme yapıldı. Yeni bir bağlantı iste." },
      { status: 429, headers: { "Retry-After": String(tokenLimit.retryAfterSeconds) } },
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const reset = resetPasswordWithToken(token, passwordHash);
  if (!reset) {
    return NextResponse.json(
      { message: "Şifre yenileme bağlantısı geçersiz veya süresi dolmuş." },
      { status: 400 },
    );
  }

  return NextResponse.json(
    { message: "Şifren yenilendi. Şimdi yeni şifrenle giriş yapabilirsin." },
    { headers: { "Cache-Control": "no-store" } },
  );
}

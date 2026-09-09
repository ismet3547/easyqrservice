import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { isSameOrigin } from "@/lib/auth";
import { db } from "@/lib/db";
import { createPasswordResetUrl, sendPasswordResetEmail } from "@/lib/email";
import {
  createPasswordResetToken,
  revokePasswordResetToken,
} from "@/lib/password-reset";
import { isRecordWithOnlyKeys, readJsonRequest } from "@/lib/http";
import { checkRateLimit, getClientAddress } from "@/lib/rate-limit";

export const runtime = "nodejs";

const maximumRequestBytes = 4 * 1024;
const minimumResponseMs = 500;
const genericMessage = "Bu adresle eşleşen bir hesap varsa şifre yenileme bağlantısı gönderildi.";

type ForgotPasswordBody = { email?: unknown };
type UserRow = { id: string; email: string };

function normalizeEmail(value: string) {
  return value.trim().toLocaleLowerCase("en-US");
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 254;
}

function hashRateLimitValue(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

async function waitForMinimumResponse(startedAt: number) {
  const remaining = minimumResponseMs - (Date.now() - startedAt);
  if (remaining > 0) {
    await new Promise((resolve) => setTimeout(resolve, remaining));
  }
}

export async function POST(request: Request) {
  const startedAt = Date.now();
  if (!isSameOrigin(request)) {
    return NextResponse.json({ message: "Geçersiz istek kaynağı." }, { status: 403 });
  }

  const parsed = await readJsonRequest(request, maximumRequestBytes);
  if (!parsed.ok) {
    return NextResponse.json(
      { message: parsed.reason === "too-large" ? "İstek çok büyük." : "Geçersiz istek." },
      { status: parsed.status },
    );
  }
  if (!isRecordWithOnlyKeys(parsed.value, ["email"])) {
    return NextResponse.json({ message: "Geçersiz istek." }, { status: 400 });
  }
  const body = parsed.value as ForgotPasswordBody;

  const email = typeof body.email === "string" ? normalizeEmail(body.email) : "";
  if (!isValidEmail(email)) {
    return NextResponse.json({ message: "Geçerli bir e-posta adresi gir." }, { status: 400 });
  }

  const clientAddress = getClientAddress(request);
  const ipLimit = checkRateLimit(`forgot-password:ip:${clientAddress}`, 8, 15 * 60 * 1000);
  const emailLimit = checkRateLimit(
    `forgot-password:email:${hashRateLimitValue(email)}`,
    3,
    15 * 60 * 1000,
  );
  if (!ipLimit.allowed || !emailLimit.allowed) {
    await waitForMinimumResponse(startedAt);
    return NextResponse.json(
      { message: genericMessage },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
          "Retry-After": String(Math.max(ipLimit.retryAfterSeconds, emailLimit.retryAfterSeconds)),
        },
      },
    );
  }

  const user = db.prepare("SELECT id, email FROM users WHERE email = ?")
    .get(email) as UserRow | undefined;
  if (user) {
    const reset = createPasswordResetToken(user.id);
    try {
      await sendPasswordResetEmail({
        recipient: user.email,
        resetUrl: createPasswordResetUrl(reset.token),
      });
    } catch (error) {
      revokePasswordResetToken(reset.token);
      console.error("Password reset email could not be delivered.", {
        userId: user.id,
        error: error instanceof Error ? error.message : "unknown",
      });
    }
  }

  await waitForMinimumResponse(startedAt);
  return NextResponse.json(
    { message: genericMessage },
    { headers: { "Cache-Control": "no-store" } },
  );
}

import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { createSession, isSameOrigin } from "@/lib/auth";
import { getAccountAccess } from "@/lib/account-plan";
import { db } from "@/lib/db";
import { isRecordWithOnlyKeys, readJsonRequest } from "@/lib/http";
import { checkRateLimit, getClientAddress } from "@/lib/rate-limit";

export const runtime = "nodejs";

type LoginBody = {
  email?: string;
  password?: string;
  remember?: boolean;
};

type LoginUserRow = {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  created_at: string;
};

const dummyPasswordHash = "$2b$12$C6UzMDM.H6dfI/f/IKcEe.5vAxiQC4a8yCq5c0qF4YqVv5C3GQZe";
const maximumRequestBytes = 4 * 1024;

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ message: "Geçersiz istek kaynağı." }, { status: 403 });
  }

  const rateLimit = checkRateLimit(`login:${getClientAddress(request)}`, 10, 15 * 60 * 1000);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { message: "Çok fazla giriş denemesi yapıldı. Biraz sonra tekrar dene." },
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
    !isRecordWithOnlyKeys(parsed.value, ["email", "password", "remember"]) ||
    typeof parsed.value.email !== "string" ||
    typeof parsed.value.password !== "string" ||
    (parsed.value.remember !== undefined && typeof parsed.value.remember !== "boolean")
  ) {
    return NextResponse.json({ message: "Geçersiz istek." }, { status: 400 });
  }
  const body = parsed.value as LoginBody;

  const email = (body.email || "").trim().toLocaleLowerCase("en-US");
  const password = body.password || "";
  if (!email || email.length > 254 || !password || Buffer.byteLength(password, "utf8") > 72) {
    return NextResponse.json({ message: "E-posta veya şifre uygun değil." }, { status: 400 });
  }

  const accountRateLimit = checkRateLimit(
    `login:account:${email}`,
    10,
    15 * 60 * 1000,
  );
  if (!accountRateLimit.allowed) {
    return NextResponse.json(
      { message: "Çok fazla giriş denemesi yapıldı. Biraz sonra tekrar dene." },
      {
        status: 429,
        headers: { "Retry-After": String(accountRateLimit.retryAfterSeconds) },
      },
    );
  }

  const user = db
    .prepare("SELECT id, name, email, password_hash, created_at FROM users WHERE email = ?")
    .get(email) as LoginUserRow | undefined;
  const passwordMatches = await bcrypt.compare(password, user?.password_hash || dummyPasswordHash);

  if (!user || !passwordMatches || !db.prepare(
    "SELECT 1 FROM users WHERE id = ? AND password_hash = ?",
  ).get(user.id, user.password_hash)) {
    return NextResponse.json({ message: "E-posta veya şifre hatalı." }, { status: 401 });
  }

  await createSession(user.id, body.remember !== false);
  return NextResponse.json(
    {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.created_at,
        account: getAccountAccess(user.id),
      },
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}

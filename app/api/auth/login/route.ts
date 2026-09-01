import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { createSession, isSameOrigin } from "@/lib/auth";
import { db } from "@/lib/db";
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

  let body: LoginBody;
  try {
    body = (await request.json()) as LoginBody;
  } catch {
    return NextResponse.json({ message: "Geçersiz istek." }, { status: 400 });
  }

  const email = (body.email || "").trim().toLocaleLowerCase("en-US");
  const password = body.password || "";
  if (!email || !password) {
    return NextResponse.json({ message: "E-posta ve şifre zorunludur." }, { status: 400 });
  }

  const user = db
    .prepare("SELECT id, name, email, password_hash, created_at FROM users WHERE email = ?")
    .get(email) as LoginUserRow | undefined;
  const passwordMatches = await bcrypt.compare(password, user?.password_hash || dummyPasswordHash);

  if (!user || !passwordMatches) {
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
      },
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}

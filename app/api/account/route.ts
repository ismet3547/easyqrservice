import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { deleteUserAccount } from "@/lib/account";
import { deleteCurrentSession, getCurrentUser, isSameOrigin } from "@/lib/auth";
import { db } from "@/lib/db";
import { checkRateLimit, getClientAddress } from "@/lib/rate-limit";

export const runtime = "nodejs";

const maximumRequestBytes = 4 * 1024;
const requiredConfirmation = "HESABIMI SİL";

type DeleteAccountBody = {
  confirmation?: unknown;
  currentPassword?: unknown;
};

type PasswordRow = { password_hash: string };

export async function DELETE(request: Request) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ message: "Geçersiz istek kaynağı." }, { status: 403 });
  }
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Giriş gerekli." }, { status: 401 });

  const rateLimit = checkRateLimit(
    `delete-account:${user.id}:${getClientAddress(request)}`,
    5,
    60 * 60 * 1000,
  );
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { message: "Çok fazla hesap silme denemesi yapıldı. Biraz sonra tekrar dene." },
      { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } },
    );
  }

  const contentType = (request.headers.get("content-type") || "").split(";", 1)[0].trim();
  const declaredLength = Number(request.headers.get("content-length"));
  if (
    contentType !== "application/json" ||
    (Number.isFinite(declaredLength) && declaredLength > maximumRequestBytes)
  ) {
    return NextResponse.json({ message: "Geçersiz istek." }, { status: 400 });
  }

  let input: unknown;
  try {
    const rawBody = await request.text();
    if (Buffer.byteLength(rawBody, "utf8") > maximumRequestBytes) throw new Error("too large");
    input = JSON.parse(rawBody) as unknown;
  } catch {
    return NextResponse.json({ message: "Geçersiz istek." }, { status: 400 });
  }

  if (
    !input || typeof input !== "object" || Array.isArray(input) ||
    Object.keys(input).some((key) => !["confirmation", "currentPassword"].includes(key))
  ) {
    return NextResponse.json({ message: "Geçersiz istek." }, { status: 400 });
  }
  const body = input as DeleteAccountBody;

  const currentPassword = typeof body.currentPassword === "string" ? body.currentPassword : "";
  const confirmation = typeof body.confirmation === "string" ? body.confirmation : "";
  if (!currentPassword || Buffer.byteLength(currentPassword, "utf8") > 72) {
    return NextResponse.json({ message: "Mevcut şifreni gir." }, { status: 400 });
  }
  if (confirmation !== requiredConfirmation) {
    return NextResponse.json(
      { message: `Onay alanına tam olarak “${requiredConfirmation}” yaz.` },
      { status: 400 },
    );
  }

  const account = db.prepare("SELECT password_hash FROM users WHERE id = ?")
    .get(user.id) as PasswordRow | undefined;
  const passwordMatches = account
    ? await bcrypt.compare(currentPassword, account.password_hash)
    : false;
  if (!passwordMatches) {
    return NextResponse.json({ message: "Mevcut şifren hatalı." }, { status: 401 });
  }

  const deleted = deleteUserAccount(user.id);
  if (!deleted) {
    return NextResponse.json({ message: "Hesap bulunamadı." }, { status: 404 });
  }
  await deleteCurrentSession();
  return NextResponse.json(
    { success: true },
    { headers: { "Cache-Control": "no-store" } },
  );
}

import { NextResponse } from "next/server";
import { isSameOrigin } from "@/lib/auth";
import { appLocaleCookieName, isAppLocale } from "@/lib/i18n";
import { isRecordWithOnlyKeys, readJsonRequest } from "@/lib/http";

export const runtime = "nodejs";

const maximumRequestBytes = 256;

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ message: "Invalid request origin." }, { status: 403 });
  }

  const parsed = await readJsonRequest(request, maximumRequestBytes);
  if (
    !parsed.ok ||
    !isRecordWithOnlyKeys(parsed.value, ["locale"]) ||
    !isAppLocale(parsed.value.locale)
  ) {
    return NextResponse.json({ message: "Unsupported locale." }, { status: 400 });
  }

  const response = NextResponse.json(
    { locale: parsed.value.locale },
    { headers: { "Cache-Control": "no-store" } },
  );
  response.cookies.set(appLocaleCookieName, parsed.value.locale, {
    httpOnly: true,
    maxAge: 365 * 24 * 60 * 60,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
  return response;
}

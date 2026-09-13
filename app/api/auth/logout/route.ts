import { NextResponse } from "next/server";
import { deleteCurrentSession, isSameOrigin } from "@/lib/auth";
import { resolveRequestLocale } from "@/lib/i18n";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const locale = resolveRequestLocale(request);
  if (!isSameOrigin(request)) {
    return NextResponse.json(
      { message: locale === "tr" ? "Geçersiz istek kaynağı." : "Invalid request origin." },
      { status: 403 },
    );
  }
  await deleteCurrentSession();
  return NextResponse.json({ success: true }, { headers: { "Cache-Control": "no-store" } });
}

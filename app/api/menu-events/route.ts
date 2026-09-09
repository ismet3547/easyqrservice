import { NextResponse } from "next/server";
import { isSameOrigin } from "@/lib/auth";
import { readJsonRequest } from "@/lib/http";
import { isValidMenuEventBatch, recordMenuEventBatch } from "@/lib/menu-events";
import { checkRateLimit, getClientAddress } from "@/lib/rate-limit";

export const runtime = "nodejs";

const maximumRequestBytes = 16_000;

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ message: "Geçersiz istek kaynağı." }, { status: 403 });
  }

  const rateLimit = checkRateLimit(
    `menu-events:${getClientAddress(request)}`,
    120,
    60 * 1000,
  );
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { message: "Çok fazla analitik isteği gönderildi." },
      {
        status: 429,
        headers: { "Retry-After": String(rateLimit.retryAfterSeconds) },
      },
    );
  }

  const parsed = await readJsonRequest(request, maximumRequestBytes);
  if (!parsed.ok) {
    return NextResponse.json(
      { message: parsed.reason === "too-large" ? "İstek çok büyük." : "Geçersiz istek." },
      { status: parsed.status },
    );
  }
  const body = parsed.value;
  if (!isValidMenuEventBatch(body)) {
    return NextResponse.json({ message: "Geçersiz analitik verisi." }, { status: 400 });
  }

  const result = recordMenuEventBatch(body);
  if (!result.found) {
    return NextResponse.json({ message: "Oturum bulunamadı." }, { status: 404 });
  }

  return NextResponse.json(
    { accepted: result.accepted },
    {
      status: 202,
      headers: { "Cache-Control": "no-store" },
    },
  );
}

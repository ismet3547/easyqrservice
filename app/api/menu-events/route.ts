import { NextResponse } from "next/server";
import { isSameOrigin } from "@/lib/auth";
import { isValidMenuEventBatch, recordMenuEventBatch } from "@/lib/menu-events";
import { checkRateLimit, getClientAddress } from "@/lib/rate-limit";

export const runtime = "nodejs";

const maximumRequestBytes = 16_000;

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ message: "Geçersiz istek kaynağı." }, { status: 403 });
  }

  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > maximumRequestBytes) {
    return NextResponse.json({ message: "İstek çok büyük." }, { status: 413 });
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

  const rawBody = await request.text();
  if (new TextEncoder().encode(rawBody).byteLength > maximumRequestBytes) {
    return NextResponse.json({ message: "İstek çok büyük." }, { status: 413 });
  }
  let body: unknown = null;
  try {
    body = JSON.parse(rawBody) as unknown;
  } catch {
    return NextResponse.json({ message: "Geçersiz istek." }, { status: 400 });
  }
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

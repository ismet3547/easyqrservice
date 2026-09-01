import { NextResponse } from "next/server";
import { deleteCurrentSession, isSameOrigin } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ message: "Geçersiz istek kaynağı." }, { status: 403 });
  }
  await deleteCurrentSession();
  return NextResponse.json({ success: true }, { headers: { "Cache-Control": "no-store" } });
}

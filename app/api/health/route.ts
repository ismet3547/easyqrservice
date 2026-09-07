import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const result = db.prepare("SELECT 1 AS ready").get() as { ready?: number } | undefined;
    if (result?.ready !== 1) throw new Error("Database readiness query failed.");

    return NextResponse.json(
      { status: "ok" },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error(
      "Health check failed:",
      error instanceof Error ? error.message : "Unknown database error.",
    );
    return NextResponse.json(
      { status: "unavailable" },
      {
        status: 503,
        headers: { "Cache-Control": "no-store" },
      },
    );
  }
}

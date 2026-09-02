import { NextResponse } from "next/server";
import { aiCreditCosts, getAICreditAccount, initialAICreditBalance } from "@/lib/ai-credits";
import { getCurrentUser } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { message: "Giriş gerekli." },
      {
        status: 401,
        headers: { "Cache-Control": "no-store" },
      },
    );
  }

  return NextResponse.json(
    {
      credits: {
        ...getAICreditAccount(user.id),
        costs: aiCreditCosts,
        initialBalance: initialAICreditBalance,
      },
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}

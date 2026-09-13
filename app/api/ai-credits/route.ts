import { NextResponse } from "next/server";
import { aiCreditCosts, getAICreditAccount, initialAICreditBalance } from "@/lib/ai-credits";
import { getCurrentUser } from "@/lib/auth";
import { resolveRequestLocale } from "@/lib/i18n";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const locale = resolveRequestLocale(request);
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { message: locale === "tr" ? "Giriş gerekli." : "Login required." },
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

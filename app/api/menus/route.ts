import { NextResponse } from "next/server";
import { getCurrentUser, isSameOrigin } from "@/lib/auth";
import { getAccountAccess, getAccountFeatureBlock } from "@/lib/account-plan";
import { isRecordWithOnlyKeys, readJsonRequest } from "@/lib/http";
import {
  createUserMenu,
  isValidMenuData,
  isValidMenuTheme,
  listUserMenus,
} from "@/lib/menus";
import { resolveRequestLocale } from "@/lib/i18n";

export const runtime = "nodejs";

const maximumRequestBytes = 12 * 1024 * 1024;

export async function GET(request: Request) {
  const locale = resolveRequestLocale(request);
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: locale === "tr" ? "Giriş gerekli." : "Login required." }, { status: 401 });
  return NextResponse.json(
    { menus: listUserMenus(user.id) },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function POST(request: Request) {
  const locale = resolveRequestLocale(request);
  const t = (english: string, turkish: string) => locale === "tr" ? turkish : english;
  if (!isSameOrigin(request)) {
    return NextResponse.json({ message: t("Invalid request origin.", "Geçersiz istek kaynağı.") }, { status: 403 });
  }
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: t("Login required.", "Giriş gerekli.") }, { status: 401 });

  const parsed = await readJsonRequest(request, maximumRequestBytes);
  if (!parsed.ok) {
    return NextResponse.json(
      { message: parsed.reason === "too-large" ? t("Menu data is too large.", "Menü verisi çok büyük.") : t("Invalid request.", "Geçersiz istek.") },
      { status: parsed.status },
    );
  }
  if (!isRecordWithOnlyKeys(parsed.value, ["menu", "theme"])) {
    return NextResponse.json({ message: t("Invalid request.", "Geçersiz istek.") }, { status: 400 });
  }
  const body = parsed.value;
  if (!isValidMenuData(body.menu) || !isValidMenuTheme(body.theme)) {
    return NextResponse.json({ message: t("Invalid menu data.", "Geçersiz menü verisi.") }, { status: 400 });
  }

  const accountBlock = getAccountFeatureBlock(getAccountAccess(user.id), "create-menu", locale);
  if (accountBlock) {
    return NextResponse.json(
      { code: accountBlock.code, message: accountBlock.message },
      { status: accountBlock.status },
    );
  }

  const menu = createUserMenu(user.id, body.menu, body.theme);
  return NextResponse.json({ menu }, { status: 201 });
}

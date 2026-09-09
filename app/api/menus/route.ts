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

export const runtime = "nodejs";

const maximumRequestBytes = 12 * 1024 * 1024;

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Giriş gerekli." }, { status: 401 });
  return NextResponse.json(
    { menus: listUserMenus(user.id) },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ message: "Geçersiz istek kaynağı." }, { status: 403 });
  }
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Giriş gerekli." }, { status: 401 });

  const parsed = await readJsonRequest(request, maximumRequestBytes);
  if (!parsed.ok) {
    return NextResponse.json(
      { message: parsed.reason === "too-large" ? "Menü verisi çok büyük." : "Geçersiz istek." },
      { status: parsed.status },
    );
  }
  if (!isRecordWithOnlyKeys(parsed.value, ["menu", "theme"])) {
    return NextResponse.json({ message: "Geçersiz istek." }, { status: 400 });
  }
  const body = parsed.value;
  if (!isValidMenuData(body.menu) || !isValidMenuTheme(body.theme)) {
    return NextResponse.json({ message: "Geçersiz menü verisi." }, { status: 400 });
  }

  const accountBlock = getAccountFeatureBlock(getAccountAccess(user.id), "create-menu");
  if (accountBlock) {
    return NextResponse.json(
      { code: accountBlock.code, message: accountBlock.message },
      { status: accountBlock.status },
    );
  }

  const menu = createUserMenu(user.id, body.menu, body.theme);
  return NextResponse.json({ menu }, { status: 201 });
}

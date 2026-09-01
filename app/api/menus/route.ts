import { NextResponse } from "next/server";
import { getCurrentUser, isSameOrigin } from "@/lib/auth";
import {
  createUserMenu,
  isValidMenuData,
  isValidMenuTheme,
  listUserMenus,
} from "@/lib/menus";

export const runtime = "nodejs";

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

  const body = (await request.json().catch(() => null)) as
    | { menu?: unknown; theme?: unknown }
    | null;
  if (!body) return NextResponse.json({ message: "Geçersiz istek." }, { status: 400 });
  if (!isValidMenuData(body.menu) || !isValidMenuTheme(body.theme)) {
    return NextResponse.json({ message: "Geçersiz menü verisi." }, { status: 400 });
  }

  const menu = createUserMenu(user.id, body.menu, body.theme);
  return NextResponse.json({ menu }, { status: 201 });
}

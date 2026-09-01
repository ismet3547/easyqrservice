import { NextResponse } from "next/server";
import { getCurrentUser, isSameOrigin } from "@/lib/auth";
import {
  deleteUserMenu,
  getUserMenu,
  isValidMenuData,
  isValidMenuTheme,
  updateUserMenu,
  type MenuStatus,
} from "@/lib/menus";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Giriş gerekli." }, { status: 401 });
  const { id } = await context.params;
  const menu = getUserMenu(user.id, id);
  if (!menu) return NextResponse.json({ message: "Menü bulunamadı." }, { status: 404 });
  return NextResponse.json({ menu }, { headers: { "Cache-Control": "no-store" } });
}

export async function PATCH(request: Request, context: RouteContext) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ message: "Geçersiz istek kaynağı." }, { status: 403 });
  }
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Giriş gerekli." }, { status: 401 });
  const { id } = await context.params;
  const body = (await request.json().catch(() => null)) as
    | { menu?: unknown; theme?: unknown; status?: string }
    | null;
  if (!body) return NextResponse.json({ message: "Geçersiz istek." }, { status: 400 });

  if (!isValidMenuData(body.menu) || !isValidMenuTheme(body.theme)) {
    return NextResponse.json({ message: "Geçersiz menü verisi." }, { status: 400 });
  }
  if (body.status && !["draft", "published"].includes(body.status)) {
    return NextResponse.json({ message: "Geçersiz menü durumu." }, { status: 400 });
  }
  if (
    body.status === "published" &&
    !body.menu.categories.some((category) => category.items.length > 0)
  ) {
    return NextResponse.json({ message: "Boş bir menü yayınlanamaz." }, { status: 400 });
  }

  const menu = updateUserMenu(
    user.id,
    id,
    body.menu,
    body.theme,
    body.status as MenuStatus | undefined,
  );
  if (!menu) return NextResponse.json({ message: "Menü bulunamadı." }, { status: 404 });
  return NextResponse.json({ menu });
}

export async function DELETE(request: Request, context: RouteContext) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ message: "Geçersiz istek kaynağı." }, { status: 403 });
  }
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Giriş gerekli." }, { status: 401 });
  const { id } = await context.params;
  const deleted = deleteUserMenu(user.id, id);
  if (!deleted) return NextResponse.json({ message: "Menü bulunamadı." }, { status: 404 });
  return NextResponse.json({ success: true });
}

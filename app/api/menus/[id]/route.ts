import { NextResponse } from "next/server";
import { getCurrentUser, isSameOrigin } from "@/lib/auth";
import { getMenuReadiness } from "@/lib/menu-readiness";
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
    | { menu?: unknown; publish?: unknown; theme?: unknown; status?: string }
    | null;
  if (!body) return NextResponse.json({ message: "Geçersiz istek." }, { status: 400 });

  if (!isValidMenuData(body.menu) || !isValidMenuTheme(body.theme)) {
    return NextResponse.json({ message: "Geçersiz menü verisi." }, { status: 400 });
  }
  if (body.status && !["draft", "published"].includes(body.status)) {
    return NextResponse.json({ message: "Geçersiz menü durumu." }, { status: 400 });
  }
  if (body.publish !== undefined && typeof body.publish !== "boolean") {
    return NextResponse.json({ message: "Geçersiz yayınlama isteği." }, { status: 400 });
  }
  if (body.publish === true && body.status === "draft") {
    return NextResponse.json({ message: "Yayınlanan menü taslak durumunda olamaz." }, { status: 400 });
  }
  const existingMenu = getUserMenu(user.id, id);
  if (!existingMenu) {
    return NextResponse.json({ message: "Menü bulunamadı." }, { status: 404 });
  }
  // Backward compatibility: moving a draft to published still creates a
  // snapshot. Saving an already-published menu never changes the live copy.
  const shouldPublish = body.publish === true || (
    body.status === "published" && existingMenu.status !== "published"
  );
  if (shouldPublish) {
    const readiness = getMenuReadiness(body.menu);
    if (!readiness.canPublish) {
      return NextResponse.json(
        {
          code: "MENU_NOT_READY",
          message: readiness.blockers[0]?.description || "Menü yayınlanmaya hazır değil.",
          readiness: {
            blockerCount: readiness.blockers.length,
            score: readiness.score,
          },
        },
        { status: 400 },
      );
    }
  }

  const menu = updateUserMenu(
    user.id,
    id,
    body.menu,
    body.theme,
    {
      publish: shouldPublish,
      status: body.status as MenuStatus | undefined,
    },
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

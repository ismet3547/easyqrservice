import { NextResponse } from "next/server";
import { getCurrentUser, isSameOrigin } from "@/lib/auth";
import { getAccountAccess, getAccountFeatureBlock } from "@/lib/account-plan";
import { isRecordWithOnlyKeys, readJsonRequest } from "@/lib/http";
import { getMenuReadiness } from "@/lib/menu-readiness";
import {
  deleteUserMenu,
  getUserMenu,
  isValidMenuData,
  isValidMenuTheme,
  updateUserMenu,
  type MenuStatus,
} from "@/lib/menus";
import { resolveRequestLocale } from "@/lib/i18n";

export const runtime = "nodejs";

const maximumRequestBytes = 12 * 1024 * 1024;

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: RouteContext) {
  const locale = resolveRequestLocale(request);
  const t = (english: string, turkish: string) => locale === "tr" ? turkish : english;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: t("Login required.", "Giriş gerekli.") }, { status: 401 });
  const { id } = await context.params;
  const menu = getUserMenu(user.id, id);
  if (!menu) return NextResponse.json({ message: t("Menu not found.", "Menü bulunamadı.") }, { status: 404 });
  return NextResponse.json({ menu }, { headers: { "Cache-Control": "no-store" } });
}

export async function PATCH(request: Request, context: RouteContext) {
  const locale = resolveRequestLocale(request);
  const t = (english: string, turkish: string) => locale === "tr" ? turkish : english;
  if (!isSameOrigin(request)) {
    return NextResponse.json({ message: t("Invalid request origin.", "Geçersiz istek kaynağı.") }, { status: 403 });
  }
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: t("Login required.", "Giriş gerekli.") }, { status: 401 });
  const { id } = await context.params;
  const parsed = await readJsonRequest(request, maximumRequestBytes);
  if (!parsed.ok) {
    return NextResponse.json(
      { message: parsed.reason === "too-large" ? t("Menu data is too large.", "Menü verisi çok büyük.") : t("Invalid request.", "Geçersiz istek.") },
      { status: parsed.status },
    );
  }
  if (
    !isRecordWithOnlyKeys(parsed.value, ["menu", "publish", "theme", "status"]) ||
    (parsed.value.publish !== undefined && typeof parsed.value.publish !== "boolean") ||
    (parsed.value.status !== undefined && typeof parsed.value.status !== "string")
  ) {
    return NextResponse.json({ message: t("Invalid request.", "Geçersiz istek.") }, { status: 400 });
  }
  const body = parsed.value as {
    menu?: unknown;
    publish?: boolean;
    theme?: unknown;
    status?: string;
  };

  if (!isValidMenuData(body.menu) || !isValidMenuTheme(body.theme)) {
    return NextResponse.json({ message: t("Invalid menu data.", "Geçersiz menü verisi.") }, { status: 400 });
  }
  if (body.status && !["draft", "published"].includes(body.status)) {
    return NextResponse.json({ message: t("Invalid menu status.", "Geçersiz menü durumu.") }, { status: 400 });
  }
  if (body.publish !== undefined && typeof body.publish !== "boolean") {
    return NextResponse.json({ message: t("Invalid publish request.", "Geçersiz yayınlama isteği.") }, { status: 400 });
  }
  if (body.publish === true && body.status === "draft") {
    return NextResponse.json({ message: t("A published menu cannot remain in draft status.", "Yayınlanan menü taslak durumunda olamaz.") }, { status: 400 });
  }
  const existingMenu = getUserMenu(user.id, id);
  if (!existingMenu) {
    return NextResponse.json({ message: t("Menu not found.", "Menü bulunamadı.") }, { status: 404 });
  }
  const expectedVersion = request.headers.get("if-match");
  if (!expectedVersion) {
    return NextResponse.json(
      { message: t("A menu version is required. Refresh the page and try again.", "Menü sürümü gerekli. Sayfayı yenileyip tekrar dene.") },
      { status: 428 },
    );
  }
  if (expectedVersion !== `"${existingMenu.updatedAt}"`) {
    return NextResponse.json(
      { code: "MENU_CONFLICT", message: t("The menu changed in another tab. Download your draft and refresh the page.", "Menü başka bir sekmede değişti. Taslağını indirip sayfayı yenile.") },
      { status: 409 },
    );
  }
  // Backward compatibility: moving a draft to published still creates a
  // snapshot. Saving an already-published menu never changes the live copy.
  const shouldPublish = body.publish === true || (
    body.status === "published" && existingMenu.status !== "published"
  );
  if (shouldPublish) {
    const accountBlock = getAccountFeatureBlock(getAccountAccess(user.id), "publish", locale);
    if (accountBlock) {
      return NextResponse.json(
        { code: accountBlock.code, message: accountBlock.message },
        { status: accountBlock.status },
      );
    }
    const readiness = getMenuReadiness(body.menu, locale);
    if (!readiness.canPublish) {
      return NextResponse.json(
        {
          code: "MENU_NOT_READY",
          message: readiness.blockers[0]?.description || t("The menu is not ready to publish.", "Menü yayınlanmaya hazır değil."),
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
      expectedUpdatedAt: existingMenu.updatedAt,
    },
  );
  if (!menu) {
    if (getUserMenu(user.id, id)) {
      return NextResponse.json(
        { code: "MENU_CONFLICT", message: t("The menu changed in another tab. Download your draft and refresh the page.", "Menü başka bir sekmede değişti. Taslağını indirip sayfayı yenile.") },
        { status: 409 },
      );
    }
    return NextResponse.json({ message: t("Menu not found.", "Menü bulunamadı.") }, { status: 404 });
  }
  return NextResponse.json({ menu });
}

export async function DELETE(request: Request, context: RouteContext) {
  const locale = resolveRequestLocale(request);
  const t = (english: string, turkish: string) => locale === "tr" ? turkish : english;
  if (!isSameOrigin(request)) {
    return NextResponse.json({ message: t("Invalid request origin.", "Geçersiz istek kaynağı.") }, { status: 403 });
  }
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: t("Login required.", "Giriş gerekli.") }, { status: 401 });
  const { id } = await context.params;
  const deleted = deleteUserMenu(user.id, id);
  if (!deleted) return NextResponse.json({ message: t("Menu not found.", "Menü bulunamadı.") }, { status: 404 });
  return NextResponse.json({ success: true });
}

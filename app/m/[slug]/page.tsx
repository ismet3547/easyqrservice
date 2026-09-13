import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { PublicMenu } from "@/components/MenuPreview";
import {
  getMenuInterfaceLanguage,
  getMenuSourceLanguage,
  getVisibleMenu,
  resolveMenuDisplayLanguage,
} from "@/lib/menu";
import { resolveMenuDeviceType, resolveMenuTrafficSource } from "@/lib/menu-tracking";
import { getPublishedMenu, recordMenuView } from "@/lib/menus";
import {
  checkRateLimit,
  getClientAddressFromHeaders,
} from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

type PublicMenuPageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ src?: string | string[] }>;
};

export async function generateMetadata({ params }: PublicMenuPageProps): Promise<Metadata> {
  const { slug } = await params;
  const storedMenu = getPublishedMenu(slug);
  if (!storedMenu) return { title: "Menu not found — easyqr" };
  const interfaceLanguage = getMenuInterfaceLanguage(storedMenu.menu);
  return {
    alternates: { canonical: `/m/${encodeURIComponent(slug)}` },
    title: `${storedMenu.name} — ${interfaceLanguage === "tr" ? "Menü" : "Menu"}`,
    description: storedMenu.menu.subtitle || (interfaceLanguage === "tr"
      ? `${storedMenu.name} dijital menüsü`
      : `${storedMenu.name} digital menu`),
    robots: { index: true, follow: true },
  };
}

export default async function PublicMenuPage({ params, searchParams }: PublicMenuPageProps) {
  const { slug } = await params;
  const storedMenu = getPublishedMenu(slug);
  if (!storedMenu) notFound();
  const visibleMenu = getVisibleMenu(storedMenu.menu);
  const [requestHeaders, query] = await Promise.all([headers(), searchParams]);
  const initialLanguage = resolveMenuDisplayLanguage(
    visibleMenu,
    requestHeaders.get("accept-language"),
  );
  const sourceParameter = Array.isArray(query.src) ? query.src[0] : query.src;
  const requestHost = (requestHeaders.get("x-forwarded-host") || requestHeaders.get("host"))
    ?.split(",")[0]
    .trim() || null;
  const deviceType = resolveMenuDeviceType(
    requestHeaders.get("user-agent"),
    requestHeaders.get("sec-ch-ua-mobile"),
  );
  const clientAddress = getClientAddressFromHeaders(requestHeaders);
  const addressLimit = deviceType === "bot"
    ? { allowed: false }
    : checkRateLimit(
        `public-menu-view:address:${storedMenu.id}:${clientAddress}`,
        600,
        60 * 60 * 1000,
      );
  const menuLimit = addressLimit.allowed
    ? checkRateLimit(
        `public-menu-view:menu:${storedMenu.id}`,
        2_000,
        60 * 60 * 1000,
      )
    : { allowed: false };
  const analyticsVisitId = addressLimit.allowed && menuLimit.allowed
    ? recordMenuView(storedMenu.id, {
        deviceType,
        language: initialLanguage === "en" ? "en" : getMenuSourceLanguage(visibleMenu),
        source: resolveMenuTrafficSource(
          sourceParameter,
          requestHeaders.get("referer"),
          requestHost,
        ),
      })
    : null;
  return (
    <PublicMenu
      menu={visibleMenu}
      theme={storedMenu.theme}
      initialLanguage={initialLanguage}
      analyticsVisitId={analyticsVisitId || undefined}
    />
  );
}

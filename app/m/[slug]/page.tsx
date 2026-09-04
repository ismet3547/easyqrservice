import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { PublicMenu } from "@/components/MenuPreview";
import {
  getVisibleMenu,
  hasEnglishMenuTranslation,
  type MenuData,
  type MenuLanguage,
} from "@/lib/menu";
import { resolveMenuDeviceType, resolveMenuTrafficSource } from "@/lib/menu-tracking";
import { getPublishedMenu, recordMenuView } from "@/lib/menus";

export const dynamic = "force-dynamic";

type PublicMenuPageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ src?: string | string[] }>;
};

function resolveInitialLanguage(
  acceptLanguage: string | null,
  menu: MenuData,
): MenuLanguage {
  if (!acceptLanguage || !hasEnglishMenuTranslation(menu)) return "tr";

  const preferredLanguage = acceptLanguage
    .split(",")
    .map((entry, index) => {
      const [language, ...parameters] = entry.trim().split(";");
      const qualityParameter = parameters.find((parameter) => parameter.trim().startsWith("q="));
      const parsedQuality = qualityParameter
        ? Number.parseFloat(qualityParameter.trim().slice(2))
        : 1;
      return {
        language: language.toLocaleLowerCase("en-US"),
        quality: Number.isFinite(parsedQuality) ? parsedQuality : 0,
        index,
      };
    })
    .filter((entry) => entry.language && entry.language !== "*" && entry.quality > 0)
    .sort((first, second) => second.quality - first.quality || first.index - second.index)[0]?.language;

  return preferredLanguage && !preferredLanguage.startsWith("tr") ? "en" : "tr";
}

export async function generateMetadata({ params }: PublicMenuPageProps): Promise<Metadata> {
  const { slug } = await params;
  const storedMenu = getPublishedMenu(slug);
  if (!storedMenu) return { title: "Menü bulunamadı — easyqr" };
  return {
    title: `${storedMenu.name} — Menü`,
    description: storedMenu.menu.subtitle || `${storedMenu.name} dijital menüsü`,
    robots: { index: true, follow: true },
  };
}

export default async function PublicMenuPage({ params, searchParams }: PublicMenuPageProps) {
  const { slug } = await params;
  const storedMenu = getPublishedMenu(slug);
  if (!storedMenu) notFound();
  const visibleMenu = getVisibleMenu(storedMenu.menu);
  const [requestHeaders, query] = await Promise.all([headers(), searchParams]);
  const initialLanguage = resolveInitialLanguage(
    requestHeaders.get("accept-language"),
    visibleMenu,
  );
  const sourceParameter = Array.isArray(query.src) ? query.src[0] : query.src;
  const requestHost = (requestHeaders.get("x-forwarded-host") || requestHeaders.get("host"))
    ?.split(",")[0]
    .trim() || null;
  const analyticsVisitId = recordMenuView(storedMenu.id, {
    deviceType: resolveMenuDeviceType(
      requestHeaders.get("user-agent"),
      requestHeaders.get("sec-ch-ua-mobile"),
    ),
    language: initialLanguage,
    source: resolveMenuTrafficSource(
      sourceParameter,
      requestHeaders.get("referer"),
      requestHost,
    ),
  });
  return (
    <PublicMenu
      menu={visibleMenu}
      theme={storedMenu.theme}
      initialLanguage={initialLanguage}
      analyticsVisitId={analyticsVisitId || undefined}
    />
  );
}

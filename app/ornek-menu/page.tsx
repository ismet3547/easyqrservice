import type { Metadata } from "next";
import Link from "next/link";
import { PublicMenu } from "@/components/MenuPreview";
import { defaultTheme, getDemoMenu } from "@/lib/menu";
import { getRequestLocale } from "@/lib/i18n-server";
import { getLocalizedAppPath } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  return locale === "tr"
    ? {
        title: "Örnek QR Menü — easyqr",
        description: "Müşterilerinin göreceği QR menüyü kayıt olmadan dene.",
        alternates: { canonical: "/ornek-menu", languages: { en: "/sample-menu", tr: "/ornek-menu" } },
      }
    : {
        title: "Sample QR Menu — easyqr",
        description: "Try the guest-facing QR menu before creating an account.",
        alternates: { canonical: "/sample-menu", languages: { en: "/sample-menu", tr: "/ornek-menu" } },
      };
}

export default async function ExampleMenuPage() {
  const locale = await getRequestLocale();
  const t = (english: string, turkish: string) => locale === "tr" ? turkish : english;
  return <>
    <nav className="demo-menu-nav" aria-label={t("Sample menu", "Örnek menü")}>
      <Link href="/">← {t("Home", "Ana sayfa")}</Link>
      <span>{t("Sample menu", "Örnek menü")}</span>
      <Link href={getLocalizedAppPath(locale, "register")}>{t("Create your menu", "Kendi menünü oluştur")}</Link>
    </nav>
    <PublicMenu menu={getDemoMenu(locale)} theme={defaultTheme} initialLanguage="source" />
  </>;
}

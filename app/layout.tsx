import type { Metadata, Viewport } from "next";
import { LocaleProvider } from "@/components/LocaleProvider";
import { appLocaleMetadata } from "@/lib/i18n";
import { getRequestLocale } from "@/lib/i18n-server";
import { getPublicAppOrigin } from "@/lib/legal";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const localizedMetadata = locale === "tr"
    ? {
        description: "PDF veya fotoğraf menünü yükle; ürünleri, fiyatları ve kampanyaları tek yerden yönet. QR kodunu yeniden bastırmadan menünü güncelle.",
        keywords: ["QR menü", "dijital menü", "restoran menüsü", "kafe menüsü", "yapay zekâ menü"],
        title: "easyqr — QR kodun aynı, menün her zaman güncel",
      }
    : {
        description: "Turn a PDF or photo into a digital menu, update items and prices in one place, and keep the same QR code everywhere.",
        keywords: ["QR menu", "digital menu", "restaurant menu", "cafe menu", "AI menu builder"],
        title: "easyqr — One QR code, an always up-to-date menu",
      };

  return {
    applicationName: "easyqr",
    metadataBase: new URL(getPublicAppOrigin()),
    title: {
      default: localizedMetadata.title,
      template: "%s | easyqr",
    },
    description: localizedMetadata.description,
    keywords: localizedMetadata.keywords,
    robots: { index: true, follow: true },
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f6f4ef",
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const locale = await getRequestLocale();
  return (
    <html lang={appLocaleMetadata[locale].htmlLang}>
      <body><LocaleProvider locale={locale}>{children}</LocaleProvider></body>
    </html>
  );
}

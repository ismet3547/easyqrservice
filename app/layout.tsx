import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  applicationName: "easyqr",
  title: {
    default: "easyqr — QR kodun aynı, menün her zaman güncel",
    template: "%s | easyqr",
  },
  description:
    "PDF veya fotoğraf menünü yükle; ürünleri, fiyatları ve kampanyaları tek yerden yönet. QR kodunu yeniden bastırmadan menünü güncelle.",
  keywords: [
    "QR menü",
    "dijital menü",
    "restoran menüsü",
    "kafe menüsü",
    "yapay zekâ menü",
  ],
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f6f4ef",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="tr">
      <body>{children}</body>
    </html>
  );
}

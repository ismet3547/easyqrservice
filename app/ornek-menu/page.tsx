import type { Metadata } from "next";
import Link from "next/link";
import { PublicMenu } from "@/components/MenuPreview";
import { defaultTheme, demoMenu } from "@/lib/menu";

export const metadata: Metadata = {
  title: "Örnek QR Menü — easyqr",
  description: "Müşterilerinin göreceği QR menüyü kayıt olmadan dene.",
};

export default function ExampleMenuPage() {
  return <>
    <nav className="demo-menu-nav" aria-label="Örnek menü">
      <Link href="/">← Ana sayfa</Link>
      <span>Örnek menü</span>
      <Link href="/kayit">Kendi menünü oluştur</Link>
    </nav>
    <PublicMenu menu={demoMenu} theme={defaultTheme} />
  </>;
}

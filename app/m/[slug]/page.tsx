import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PublicMenu } from "@/components/MenuPreview";
import { getVisibleMenu } from "@/lib/menu";
import { getPublishedMenu, recordMenuView } from "@/lib/menus";

export const dynamic = "force-dynamic";

type PublicMenuPageProps = { params: Promise<{ slug: string }> };

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

export default async function PublicMenuPage({ params }: PublicMenuPageProps) {
  const { slug } = await params;
  const storedMenu = getPublishedMenu(slug);
  if (!storedMenu) notFound();
  recordMenuView(storedMenu.id);
  return <PublicMenu menu={getVisibleMenu(storedMenu.menu)} theme={storedMenu.theme} />;
}

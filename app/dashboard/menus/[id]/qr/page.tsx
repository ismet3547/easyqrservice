import { notFound, redirect } from "next/navigation";
import { QrCenter } from "@/components/QrCenter";
import { getCurrentUser } from "@/lib/auth";
import { getLocalizedAppPath } from "@/lib/i18n";
import { getRequestLocale } from "@/lib/i18n-server";
import { getUserMenu, listUserMenus } from "@/lib/menus";

export const dynamic = "force-dynamic";

type QrCenterPageProps = {
  params: Promise<{ id: string }>;
};

export default async function QrCenterPage({ params }: QrCenterPageProps) {
  const [user, locale, { id }] = await Promise.all([getCurrentUser(), getRequestLocale(), params]);
  if (!user) redirect(`${getLocalizedAppPath(locale, "login")}?next=/dashboard/menus/${encodeURIComponent(id)}/qr`);

  const storedMenu = getUserMenu(user.id, id);
  if (!storedMenu) notFound();

  return (
    <QrCenter
      menuCount={listUserMenus(user.id).length}
      storedMenu={storedMenu}
      user={user}
    />
  );
}

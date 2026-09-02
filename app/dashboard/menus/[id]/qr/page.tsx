import { notFound, redirect } from "next/navigation";
import { QrCenter } from "@/components/QrCenter";
import { getCurrentUser } from "@/lib/auth";
import { getUserMenu, listUserMenus } from "@/lib/menus";

export const dynamic = "force-dynamic";

type QrCenterPageProps = {
  params: Promise<{ id: string }>;
};

export default async function QrCenterPage({ params }: QrCenterPageProps) {
  const user = await getCurrentUser();
  const { id } = await params;
  if (!user) redirect(`/giris?next=/dashboard/menus/${encodeURIComponent(id)}/qr`);

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

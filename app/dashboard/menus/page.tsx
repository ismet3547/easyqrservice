import { redirect } from "next/navigation";
import { MenusDashboard } from "@/components/MenusDashboard";
import { getCurrentUser } from "@/lib/auth";
import { getLocalizedAppPath } from "@/lib/i18n";
import { getRequestLocale } from "@/lib/i18n-server";
import { listUserMenus } from "@/lib/menus";

export const dynamic = "force-dynamic";

export default async function MenusPage() {
  const [user, locale] = await Promise.all([getCurrentUser(), getRequestLocale()]);
  if (!user) redirect(`${getLocalizedAppPath(locale, "login")}?next=/dashboard/menus`);
  return <MenusDashboard user={user} initialMenus={listUserMenus(user.id)} />;
}

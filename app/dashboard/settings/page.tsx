import { redirect } from "next/navigation";
import { SettingsDashboard } from "@/components/SettingsDashboard";
import { getCurrentUser } from "@/lib/auth";
import { getLocalizedAppPath } from "@/lib/i18n";
import { getRequestLocale } from "@/lib/i18n-server";
import { listUserMenus } from "@/lib/menus";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const [user, locale] = await Promise.all([getCurrentUser(), getRequestLocale()]);
  if (!user) redirect(`${getLocalizedAppPath(locale, "login")}?next=/dashboard/settings`);
  return <SettingsDashboard initialUser={user} menuCount={listUserMenus(user.id).length} />;
}

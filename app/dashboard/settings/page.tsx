import { redirect } from "next/navigation";
import { SettingsDashboard } from "@/components/SettingsDashboard";
import { getCurrentUser } from "@/lib/auth";
import { listUserMenus } from "@/lib/menus";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/giris?next=/dashboard/settings");
  return <SettingsDashboard initialUser={user} menuCount={listUserMenus(user.id).length} />;
}

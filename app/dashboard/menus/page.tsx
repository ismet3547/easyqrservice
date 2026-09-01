import { redirect } from "next/navigation";
import { MenusDashboard } from "@/components/MenusDashboard";
import { getCurrentUser } from "@/lib/auth";
import { listUserMenus } from "@/lib/menus";

export const dynamic = "force-dynamic";

export default async function MenusPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/giris?next=/dashboard/menus");
  return <MenusDashboard user={user} initialMenus={listUserMenus(user.id)} />;
}

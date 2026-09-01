import { redirect } from "next/navigation";
import { Dashboard } from "@/components/Dashboard";
import { getCurrentUser } from "@/lib/auth";
import { listUserMenus } from "@/lib/menus";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/giris?next=/dashboard");
  const menus = listUserMenus(user.id);
  return <Dashboard user={user} initialMenus={menus} />;
}

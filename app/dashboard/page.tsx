import { redirect } from "next/navigation";
import { Dashboard } from "@/components/Dashboard";
import { getDashboardOverviewAnalytics } from "@/lib/analytics";
import { getCurrentUser } from "@/lib/auth";
import { listUserMenus } from "@/lib/menus";

export const dynamic = "force-dynamic";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ welcome?: string | string[] }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/giris?next=/dashboard");
  const params = await searchParams;
  const menus = listUserMenus(user.id);
  const analytics = getDashboardOverviewAnalytics(user.id);
  return (
    <Dashboard
      user={user}
      initialAnalytics={analytics}
      initialMenus={menus}
      initialWelcome={params.welcome === "1"}
    />
  );
}

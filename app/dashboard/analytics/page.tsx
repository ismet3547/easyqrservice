import { notFound, redirect } from "next/navigation";
import { AnalyticsDashboard } from "@/components/AnalyticsDashboard";
import { getUserAnalytics } from "@/lib/analytics";
import { getCurrentUser } from "@/lib/auth";
import { getEngagementAnalytics } from "@/lib/analytics-details";
import { listUserMenus } from "@/lib/menus";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage({ searchParams }: {
  searchParams: Promise<{ menu?: string; period?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/giris?next=/dashboard/analytics");
  const params = await searchParams;
  const menus = listUserMenus(user.id).map(({ id, name }) => ({ id, name }));
  const menuId = typeof params.menu === "string" && params.menu ? params.menu : null;
  if (menuId && !menus.some((menu) => menu.id === menuId)) notFound();
  const period = params.period === "14" ? 14 : params.period === "30" ? 30 : 7;
  return <AnalyticsDashboard key={`${menuId || "all"}:${period}`} user={user}
    analytics={getUserAnalytics(user.id, 60, menuId)} engagement={getEngagementAnalytics(user.id, menuId)}
    menuOptions={menus} selectedMenuId={menuId} initialPeriod={period} />;
}

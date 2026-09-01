import { redirect } from "next/navigation";
import { AnalyticsDashboard } from "@/components/AnalyticsDashboard";
import { getUserAnalytics } from "@/lib/analytics";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/giris?next=/dashboard/analytics");
  return <AnalyticsDashboard user={user} analytics={getUserAnalytics(user.id)} />;
}

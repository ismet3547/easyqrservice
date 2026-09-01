import { BarChart3, BookOpen, LayoutDashboard } from "lucide-react";
import Link from "next/link";

type DashboardSection = "overview" | "menus" | "analytics";

export function DashboardMobileNav({ active }: { active: DashboardSection }) {
  return (
    <nav className="dashboard-mobile-nav" aria-label="Mobil dashboard menüsü">
      <Link className={active === "overview" ? "active" : ""} href="/dashboard"><LayoutDashboard size={19} /><span>Genel bakış</span></Link>
      <Link className={active === "menus" ? "active" : ""} href="/dashboard/menus"><BookOpen size={19} /><span>Menülerim</span></Link>
      <Link className={active === "analytics" ? "active" : ""} href="/dashboard/analytics"><BarChart3 size={19} /><span>Analitik</span></Link>
    </nav>
  );
}
